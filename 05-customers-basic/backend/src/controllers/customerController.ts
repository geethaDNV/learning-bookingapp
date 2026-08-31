// Customer Controller - implements ICustomerController interface

import type { Request, Response } from 'express';
import type { ICustomerController, ICustomerService } from '@types';
import {
  createCustomerSchema,
  updateCustomerSchema,
  statusUpdateSchema,
  listCustomersQuerySchema,
  autocompleteQuerySchema,
  publicIdParamsSchema,
  gstinParamsSchema,
} from '@schemas';
import { CUSTOMER_RESPONSE_MESSAGES, CUSTOMER_ERROR_MESSAGES } from '@constants';
import { parseBody, parseParams, parseQuery, sendResponse, sendMessageResponse } from '@utils';

export class CustomerController implements ICustomerController {
  constructor(private customerService: ICustomerService) {}

  async getCustomers(req: Request, res: Response): Promise<void> {
    try {
      const query = parseQuery(listCustomersQuerySchema, req.query);
      const result = await this.customerService.search(query);
      sendResponse(res, {
        message: CUSTOMER_RESPONSE_MESSAGES.FETCH_ALL_SUCCESS,
        data: result.rows,
        meta: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
        },
      });
    } catch (error) {
      sendMessageResponse(res, CUSTOMER_ERROR_MESSAGES.INTERNAL_ERROR, 500);
    }
  }

  async getCustomer(req: Request, res: Response): Promise<void> {
    try {
      const params = parseParams(publicIdParamsSchema, req.params);
      const customer = await this.customerService.getByPublicId(params.publicId);

      if (!customer) {
        sendMessageResponse(res, CUSTOMER_RESPONSE_MESSAGES.NOT_FOUND, 404);
        return;
      }

      sendResponse(res, {
        message: CUSTOMER_RESPONSE_MESSAGES.FETCH_ONE_SUCCESS,
        data: customer,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('validation')) {
        sendMessageResponse(res, CUSTOMER_RESPONSE_MESSAGES.VALIDATION_ERROR, 400);
      } else {
        sendMessageResponse(res, CUSTOMER_ERROR_MESSAGES.INTERNAL_ERROR, 500);
      }
    }
  }

  async searchCustomers(req: Request, res: Response): Promise<void> {
    try {
      const query = parseQuery(listCustomersQuerySchema, req.query);
      const result = await this.customerService.search(query);
      sendResponse(res, {
        message: CUSTOMER_RESPONSE_MESSAGES.FETCH_ALL_SUCCESS,
        data: result.rows,
        meta: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
        },
      });
    } catch (error) {
      sendMessageResponse(res, CUSTOMER_ERROR_MESSAGES.INTERNAL_ERROR, 500);
    }
  }

  async autocompleteCustomers(req: Request, res: Response): Promise<void> {
    try {
      const query = parseQuery(autocompleteQuerySchema, req.query);
      const result = await this.customerService.autocomplete(query);
      sendResponse(res, {
        message: CUSTOMER_RESPONSE_MESSAGES.AUTOCOMPLETE_SUCCESS,
        data: result.rows,
        meta: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('validation')) {
        sendMessageResponse(res, CUSTOMER_RESPONSE_MESSAGES.VALIDATION_ERROR, 400);
      } else {
        sendMessageResponse(res, CUSTOMER_ERROR_MESSAGES.INTERNAL_ERROR, 500);
      }
    }
  }

  async getCustomerPrefill(req: Request, res: Response): Promise<void> {
    try {
      const params = parseParams(gstinParamsSchema, req.params);
      const customer = await this.customerService.getPrefillByGstin(params.gstin);
      sendResponse(res, {
        message: customer ? 'GSTIN prefill retrieved' : 'No customer data found for this GSTIN',
        data: customer,
      });
    } catch (error) {
      sendMessageResponse(res, CUSTOMER_RESPONSE_MESSAGES.VALIDATION_ERROR, 400);
    }
  }

  async createCustomer(req: Request, res: Response): Promise<void> {
    try {
      const body = parseBody(createCustomerSchema, req.body);
      const customer = await this.customerService.create(body);
      sendResponse(
        res,
        {
          message: CUSTOMER_RESPONSE_MESSAGES.CREATE_SUCCESS,
          data: customer,
        },
        201
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Duplicate')) {
          sendMessageResponse(res, error.message, 409);
        } else if (error.message.includes('validation')) {
          sendMessageResponse(res, CUSTOMER_RESPONSE_MESSAGES.VALIDATION_ERROR, 400);
        } else {
          sendMessageResponse(res, error.message, 400);
        }
      } else {
        sendMessageResponse(res, CUSTOMER_ERROR_MESSAGES.INTERNAL_ERROR, 500);
      }
    }
  }

  async updateCustomer(req: Request, res: Response): Promise<void> {
    try {
      const params = parseParams(publicIdParamsSchema, req.params);
      const body = parseBody(updateCustomerSchema, req.body);

      const customer = await this.customerService.update(params.publicId, body);
      if (!customer) {
        sendMessageResponse(res, CUSTOMER_RESPONSE_MESSAGES.NOT_FOUND, 404);
        return;
      }

      sendResponse(res, {
        message: CUSTOMER_RESPONSE_MESSAGES.UPDATE_SUCCESS,
        data: customer,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Duplicate')) {
          sendMessageResponse(res, error.message, 409);
        } else if (error.message.includes('not found')) {
          sendMessageResponse(res, CUSTOMER_RESPONSE_MESSAGES.NOT_FOUND, 404);
        } else if (error.message.includes('validation')) {
          sendMessageResponse(res, CUSTOMER_RESPONSE_MESSAGES.VALIDATION_ERROR, 400);
        } else {
          sendMessageResponse(res, error.message, 400);
        }
      } else {
        sendMessageResponse(res, CUSTOMER_ERROR_MESSAGES.INTERNAL_ERROR, 500);
      }
    }
  }

  async setCustomerStatus(req: Request, res: Response): Promise<void> {
    try {
      const params = parseParams(publicIdParamsSchema, req.params);
      const body = parseBody(statusUpdateSchema, req.body);

      const customer = await this.customerService.setStatus(params.publicId, body.isActive);
      if (!customer) {
        sendMessageResponse(res, CUSTOMER_RESPONSE_MESSAGES.NOT_FOUND, 404);
        return;
      }

      sendResponse(res, {
        message: CUSTOMER_RESPONSE_MESSAGES.STATUS_UPDATE_SUCCESS,
        data: customer,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        sendMessageResponse(res, CUSTOMER_RESPONSE_MESSAGES.NOT_FOUND, 404);
      } else {
        sendMessageResponse(res, CUSTOMER_ERROR_MESSAGES.INTERNAL_ERROR, 500);
      }
    }
  }
}
