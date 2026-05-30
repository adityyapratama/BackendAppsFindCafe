const STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ARCHIVED: 'archived',
};

const REPORT_STATUS = {
  OPEN: 'open',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
};

const APPROVAL_MODE = {
  MANUAL: 'manual',
  AUTO: 'auto',
};

const REASON_TYPES = [
  'wrong_location',
  'closed',
  'duplicate',
  'inappropriate',
  'wrong_information',
  'other',
];

export { STATUS, REPORT_STATUS, APPROVAL_MODE, REASON_TYPES };
