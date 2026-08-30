/**
 * Typed Redux Hooks
 * 
 * Pre-typed useDispatch and useSelector hooks.
 * Use these instead of plain redux hooks to get automatic type inference.
 */

import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { RootState, AppDispatch } from '../store/index';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
