export enum ChoiceStatus {
    APPLIED = 'APPLIED', // The student has submitted a request for a project.
    UNDER_REVIEW = 'UNDER_REVIEW', // The tutor is reviewing the student's application.
    SHORTLISTED = 'SHORTLISTED', // The student is among the top candidates but not yet confirmed.
    ALLOCATED = 'ALLOCATED', // The student has been assigned to the project.
    NOT_SELECTED = 'NOT_SELECTED', // The student was not selected for this project.
    WITHDRAWN = 'WITHDRAWN' // The student has removed their application from this project.
  }