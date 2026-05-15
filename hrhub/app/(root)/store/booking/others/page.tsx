"use client"

import BookingManagementPage from "../booking-manager"

export default function OthersBookingPage() {
    return (
        <BookingManagementPage
            bookingType="Others"
            description="Book miscellaneous materials and miscellaneous items."
            accentColor="purple"
        />
    )
}
