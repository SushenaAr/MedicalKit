// Имитация сетевых запросов для работы на демонстрационных данных до интеграции с API.
// Задержка позволяет увидеть состояния загрузки, а режимы ниже — состояния ошибки и пустых данных.
//
// Режим включается параметром адреса при открытии приложения:
//   ?demo=slow   — долгие ответы (видны скелетоны и индикаторы загрузки);
//   ?demo=error  — автоматическая загрузка списков завершается ошибкой, повтор по кнопке — успешно;
//   ?demo=empty  — приложение стартует с пустыми данными.

export type DemoMode = 'normal' | 'slow' | 'error' | 'empty'

function readDemoMode(): DemoMode {
  const value = new URLSearchParams(window.location.search).get('demo')
  return value === 'slow' || value === 'error' || value === 'empty' ? value : 'normal'
}

/** Режим определяется один раз при запуске, чтобы не сбрасываться при навигации */
export const demoMode: DemoMode = readDemoMode()

/** Ошибка «сервера» с сообщением, которое можно показать пользователю */
export class ApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  return 'Не удалось выполнить запрос. Проверьте соединение и попробуйте ещё раз.'
}

interface RequestOptions {
  /** Номер попытки загрузки: в режиме `error` первая попытка (0) завершается ошибкой */
  attempt?: number
}

/** Выполняет `action` асинхронно с сетевой задержкой; исключения из `action` становятся ошибками запроса */
export function fakeRequest<T>(action: () => T, { attempt }: RequestOptions = {}): Promise<T> {
  const delay = demoMode === 'slow' ? 1800 : 300 + Math.random() * 300

  return new Promise<T>((resolve, reject) => {
    window.setTimeout(() => {
      if (demoMode === 'error' && attempt === 0) {
        reject(new ApiError('Сервер не ответил. Попробуйте ещё раз.'))
        return
      }
      try {
        // Копия, чтобы компоненты не могли изменить «серверные» данные по ссылке
        resolve(structuredClone(action()))
      } catch (error) {
        reject(error)
      }
    }, delay)
  })
}
