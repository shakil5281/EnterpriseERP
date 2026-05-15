"use client"

import BookingManagementPage from "../booking-manager"

export default function AccessoriesBookingPage() {
    return (
        <BookingManagementPage
            bookingType="Accessories"
            description="Manage trim and accessory bookings for production orders."
            accentColor="sky"
        />
    )
}
