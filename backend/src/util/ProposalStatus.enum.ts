export enum ProposalStatus {
  PENDING = 'PENDING', // Proposal is submitted and awaiting review
  APPROVED = 'APPROVED', // Proposal has been approved by the tutor
  REJECTED = 'REJECTED', // Proposal has been rejected by the tutor
  UNDER_REVIEW = 'UNDER_REVIEW', // Proposal is currently being reviewed
  WITHDRAWN = 'WITHDRAWN', //// Proposal has been withdrawn by student
}
