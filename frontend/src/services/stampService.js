import axios from 'axios';

// Base URL for the stamps API (replace with your actual API URL)
const API_URL = 'http://127.0.0.1:8000/stamps/stamps/';

// Function to get the token from localStorage (or your Auth context)
const getAuthToken = () => {
  return localStorage.getItem('authToken'); // Adjust if you're using a different method to store the token
};

// Function to refresh the token (you should implement this on your backend)
const refreshAuthToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // Adjust the key name to match backend expectations
    const response = await axios.post('http://127.0.0.1:8000/auth/token/refresh/', { refresh: refreshToken });

    const { access } = response.data;  // Access token is returned under the key "access"
    localStorage.setItem("authToken", access); // Save new access token
    return access;  // Return the new access token
  } catch (error) {
    console.error("Error during token refresh:", error);
    throw error.response?.data || error.message;
  }
};

// Function to get a new token if the current one is expired
const getValidToken = async () => {
  let token = getAuthToken();
  try {
    // Attempt a request to check if the token is valid
    await axios.get(API_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return token;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('Token expired or invalid. Attempting to refresh...');
      token = await refreshAuthToken();
      // Retry the failed request with the new token
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return token;
    } else {
      throw error;
    }
  }
};

// Function to get all stamps
export const getStamps = async () => {
  try {
    const token = await getValidToken(); // Get the valid token
    const response = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Return the `results` array directly from the paginated response
    if (response.data && Array.isArray(response.data.results)) {
      return response.data.results; // List of stamps from the "results" field
    } else {
      throw new Error("Invalid data format received from the API");
    }
  } catch (error) {
    console.error("Error fetching stamps:", error);
    throw error;
  }
};


// Function to create a new stamp
export const createStamp = async (stampData) => {
  try {
    const token = await getValidToken(); // Get the valid token
    const response = await axios.post(API_URL, stampData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data; // Created stamp data
  } catch (error) {
    console.error('Error creating stamp:', error);
    throw error;
  }
};

// Function to get a specific stamp by ID
export const getStampById = async (id) => {
  try {
    const token = await getValidToken(); // Get the valid token
    const response = await axios.get(`${API_URL}${id}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data; // Specific stamp data
  } catch (error) {
    console.error(`Error fetching stamp with id ${id}:`, error);
    throw error;
  }
};

// Function to update a specific stamp by ID
export const updateStamp = async (id, updatedData) => {
  try {
    const token = await getValidToken(); // Get the valid token
    const response = await axios.put(`${API_URL}${id}/`, updatedData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data; // Updated stamp data
  } catch (error) {
    console.error(`Error updating stamp with id ${id}:`, error);
    throw error;
  }
};

// Function to delete a specific stamp by ID
export const deleteStamp = async (id, token) => {
  try {
    const response = await axios.delete(`${API_URL}${id}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data; // Response confirming deletion
  } catch (error) {
    console.error(`Error deleting stamp with id ${id}:`, error);
    throw error;
  }
};
