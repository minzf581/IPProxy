export const isValidUsername = (username: string): boolean => {
  return /^[a-zA-Z0-9_]{4,20}$/.test(username);
};

export const isValidPassword = (password: string): boolean => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,20}$/.test(password);
};

export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  return /^1[3-9]\d{9}$/.test(phone);
};

export const isValidIP = (ip: string): boolean => {
  return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);
};

export const isValidPort = (port: number): boolean => {
  return port >= 1 && port <= 65535;
}; 