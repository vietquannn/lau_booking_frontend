// src/services/membership.service.js
import apiClient from './api';

const getMembershipTiers = () => {
    console.log('Calling API: GET /membership-tiers');
    return apiClient.get('/membership-tiers');
};

export const membershipService = {
    getMembershipTiers,
};