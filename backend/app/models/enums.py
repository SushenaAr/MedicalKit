from enum import StrEnum


class MedicineForm(StrEnum):
    TABLETS = "tablets"
    CAPSULES = "capsules"
    SYRUP = "syrup"
    DROPS = "drops"
    OINTMENT = "ointment"
    SPRAY = "spray"
    SOLUTION = "solution"
    POWDER = "powder"


class ShelterKind(StrEnum):
    ANIMALS = "animals"
    PEOPLE = "people"


class DonationStatus(StrEnum):
    PLANNED = "planned"
    HANDED = "handed"
