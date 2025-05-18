import { configureStore } from '@reduxjs/toolkit';
import documentReducer from './slices/documentSlice';
import userReducer from './slices/userSlice';

const store = configureStore({
  reducer: {
    document: documentReducer,
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
