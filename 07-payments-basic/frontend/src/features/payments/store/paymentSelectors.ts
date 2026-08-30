import { RootState } from "../../../store/store";

export const selectPayments = (state: RootState) => state.payments.payments;
export const selectSelectedPayment = (state: RootState) => state.payments.selectedPayment;
export const selectPaymentStatus = (state: RootState) => state.payments.paymentStatus;
export const selectPaymentLoading = (state: RootState) => state.payments.loading;
export const selectPaymentError = (state: RootState) => state.payments.error;
export const selectPaymentTotal = (state: RootState) => state.payments.total;
export const selectPaymentPage = (state: RootState) => state.payments.page;
export const selectPaymentPageSize = (state: RootState) => state.payments.pageSize;
