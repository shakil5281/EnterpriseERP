"use client"

import BookingManagementPage from "../booking-manager"

export default function ZipperBookingPage() {
    return (
        <BookingManagementPage
            bookingType="Zipper"
            description="Manage zipper allocations and puller requirements."
            accentColor="amber"
        />
    )
}
