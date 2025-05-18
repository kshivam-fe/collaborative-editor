// File: src/features/user/userSlice.ts
import { createSlice } from '@reduxjs/toolkit';

interface UserState {
  id: string;
  name: string;
}

const generateUser = (): UserState => {
  const id = crypto.randomUUID();
  const name = `User-${Math.floor(Math.random() * 1000)}`;
  return { id, name };
};

const initialState: UserState = generateUser();

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
});

export default userSlice.reducer;
