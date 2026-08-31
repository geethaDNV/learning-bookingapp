// Constants for Customer domain

export const CUSTOMER_RESPONSE_MESSAGES = {
  FETCH_ALL_SUCCESS: 'Customers retrieved successfully',
  FETCH_ONE_SUCCESS: 'Customer retrieved successfully',
  AUTOCOMPLETE_SUCCESS: 'Autocomplete results retrieved',
  CREATE_SUCCESS: 'Customer created successfully',
  UPDATE_SUCCESS: 'Customer updated successfully',
  STATUS_UPDATE_SUCCESS: 'Customer status updated successfully',
  NOT_FOUND: 'Customer not found',
  ALREADY_EXISTS: 'Customer with this email/GSTIN already exists',
  VALIDATION_ERROR: 'Validation error',
};

export const CUSTOMER_ERROR_MESSAGES = {
  DUPLICATE_EMAIL: 'A customer with this email already exists',
  DUPLICATE_GSTIN: 'A customer with this GSTIN already exists',
  NOT_FOUND: 'Customer not found',
  INVALID_PAYLOAD: 'Invalid payload',
  INTERNAL_ERROR: 'Internal server error',
};
