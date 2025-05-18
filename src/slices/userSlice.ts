import { createSlice } from '@reduxjs/toolkit';

interface UserState {
  id: string;
  name: string;
}

const usernames = [
  "Skywalker",
  "Neo",
  "Luna",
  "Pixel",
  "Nova",
  "Echo",
  "Zephyr",
  "Orion",
  "Maverick",
  "Sparrow",
];

const STORAGE_KEY = "collab-user";

const generateUser = (): UserState => {
  const id = crypto.randomUUID();
  const randomIndex = Math.floor(Math.random() * usernames.length);
  const name = usernames[randomIndex];
  return { id, name };
};

const loadUserFromSession = (): UserState | null => {
  try {
    const userStr = sessionStorage.getItem(STORAGE_KEY);
    if (!userStr) return null;
    return JSON.parse(userStr) as UserState;
  } catch {
    return null;
  }
};

const saveUserToSession = (user: UserState) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    // ignore write errors
  }
};

let initialState = loadUserFromSession();

if (!initialState) {
  initialState = generateUser();
  saveUserToSession(initialState);
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
});

export default userSlice.reducer;
