/**
 * Formats a phone number string to the format: +90 500 000 00 00
 * @param {string} phone 
 * @returns {string}
 */
export const formatPhoneNumber = (phone) => {
    if (!phone) return '-';

    // Remove all non-numeric characters
    let cleaned = phone.toString().replace(/\D/g, '');

    // Handle common initial 0 (e.g., 05078721533 -> 5078721533)
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }

    // If it's 10 digits (e.g. 5078721533), prepend 90
    if (cleaned.length === 10) {
        cleaned = '90' + cleaned;
    } 
    
    // We expect 12 digits now: 90 507 872 1533
    // Format: +90 507 872 15 33
    const match = cleaned.match(/^(\d{2})(\d{3})(\d{3})(\d{2})(\d{2})$/);

    if (match) {
        return `+${match[1]} ${match[2]} ${match[3]} ${match[4]} ${match[5]}`;
    }

    // Fallback if the number doesn't match the expected length, but still clean it if it looks like a number
    if (cleaned.length > 10) {
        return `+${cleaned}`;
    }

    return phone;
};
