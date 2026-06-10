import { useEffect } from 'react';
import { createAdminUser } from '../firebase';

const Setup = () => {
  useEffect(() => {
    // Run admin setup once on app initialisation
    createAdminUser().catch((err) => {
      console.error('Setup error:', err);
    });
  }, []); // Empty dep array — runs exactly once

  return null;
};

export default Setup;
