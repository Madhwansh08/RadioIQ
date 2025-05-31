/* Created By - Sarthak Raj & Madhwansh Srivastava
    Date:- 12 November 2024
    Updated:- 13 November 2024
*/

// Function to encrypt the password

import bcrypt from "bcrypt";

export const hashPassword = async (password) => {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.log(error);
  }
};

export const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};
