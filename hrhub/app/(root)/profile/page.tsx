"use client"

import { useEffect, useState } from "react"
import { IconUserCircle, IconMail, IconPhone, IconMapPin, IconBuilding, IconCheck, IconLoader2 } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authService, User, UserProfileUpdateDto } from "@/lib/services/auth"
import { toast } from "sonner"

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState<UserProfileUpdateDto>({
        fullName: "",
        email: "",
        phoneNumber: "",
        country: "",
        city: ""
    })

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            setLoading(true)
            const data = await authService.getProfile()
            setUser(data)
            setFormData({
                fullName: data.fullName || "",
                email: data.email || "",
                phoneNumber: data.phoneNumber || "",
                country: data.country || "",
                city: data.city || ""
            })
        } catch (error) {
            console.error("Failed to fetch profile:", error)
            toast.error("Failed to load profile data")
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setSaving(true)
            const result = await authService.updateProfile(formData)
            if (result.success) {
                toast.success("Profile updated successfully")
                // Update local user state
                if (user) {
                    const updatedUser = { ...user, ...formData }
                    setUser(updatedUser)
                    // Update localStorage user
                    const storedUser = localStorage.getItem('user')
                    if (storedUser) {
                        const parsed = JSON.parse(storedUser)
                        localStorage.setItem('user', JSON.stringify({
                            ...parsed,
                            fullName: formData.fullName,
                            email: formData.email
                        }))
                        // Notify other components (like Navbar) to refresh user data
                        window.dispatchEvent(new Event('profile-updated'))
                    }
                }
            } else {
                toast.error(result.message || "Failed to update profile")
            }
        } catch (error) {
            console.error("Update failed:", error)
            toast.error("An error occurred while saving changes")
        } finally {
            setSaving(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target
        setFormData(prev => ({ ...prev, [id]: value }))
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    const initials = user?.fullName
        ? user.fullName.split(" ").map(n => n[0]).join("").toUpperCase()
        : "U"

    return (
        <div className="container mx-auto max-w-5xl py-8 px-4 space-y-8">
            {/* Header Section with Gradient Background Effect */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 p-8 border border-border/50">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <IconUserCircle size={200} />
                </div>
                <div className="relative flex flex-col md:flex-row gap-8 items-center md:items-start">
                    <div className="relative group">
                        <Avatar className="h-32 w-32 border-4 border-background">
                            <AvatarImage src="" alt={user?.fullName} />
                            <AvatarFallback className="text-4xl font-bold bg-primary text-primary-foreground">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1" variant={user?.isActive ? "default" : "destructive"}>
                            {user?.isActive ? "Active Account" : "Inactive"}
                        </Badge>
                    </div>
                    
                    <div className="text-center md:text-left space-y-2 pt-2">
                        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                            {user?.fullName}
                        </h1>
                        <p className="text-xl text-muted-foreground font-medium flex items-center justify-center md:justify-start gap-2">
                            <Badge variant="secondary" className="font-semibold px-3 py-0.5">
                                {user?.roles?.join(", ") || "User"}
                            </Badge>
                            <span className="opacity-50">•</span>
                            <span className="text-sm font-normal">@{user?.username}</span>
                        </p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
                            <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/50 text-xs font-medium">
                                <IconMail className="h-3.5 w-3.5 text-primary" />
                                <span>{user?.email}</span>
                            </div>
                            {user?.phoneNumber && (
                                <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/50 text-xs font-medium">
                                    <IconPhone className="h-3.5 w-3.5 text-primary" />
                                    <span>{user?.phoneNumber}</span>
                                </div>
                            )}
                            {(user?.city || user?.country) && (
                                <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/50 text-xs font-medium">
                                    <IconMapPin className="h-3.5 w-3.5 text-primary" />
                                    <span>{[user?.city, user?.country].filter(Boolean).join(", ")}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Information Card */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="overflow-hidden border-none bg-card/50 backdrop-blur-sm">
                        <CardHeader className="bg-primary/5 border-b border-primary/10">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <IconBuilding className="h-5 w-5 text-primary" />
                                Assigned Access
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Roles</Label>
                                <div className="flex flex-wrap gap-1.5">
                                    {user?.roles?.map(role => (
                                        <Badge key={role} variant="outline" className="bg-primary/5 border-primary/20">
                                            {role}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <Separator className="opacity-50" />
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">User ID</Label>
                                <p className="text-xs font-mono bg-muted p-2 rounded border border-border/50 truncate">
                                    {user?.id}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-none bg-card/50 backdrop-blur-sm">
                        <CardHeader className="bg-blue-500/5 border-b border-blue-500/10">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <IconCheck className="h-5 w-5 text-blue-500" />
                                Account Security
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-medium">Two-Factor Auth</p>
                                    <p className="text-xs text-muted-foreground">Not enabled</p>
                                </div>
                                <Button variant="outline" size="sm" disabled>Enable</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Edit Form Card */}
                <Card className="lg:col-span-2 overflow-hidden border-none bg-card/30 backdrop-blur-md">
                    <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background to-background/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl font-bold">Profile Settings</CardTitle>
                                <CardDescription>Manage your public profile and contact information</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName" className="text-sm font-semibold flex items-center gap-2">
                                        <IconUserCircle className="h-4 w-4 text-primary" />
                                        Full Name
                                    </Label>
                                    <Input 
                                        id="fullName" 
                                        placeholder="Your full name" 
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className="bg-background/50 border-border/50 focus:border-primary transition-all duration-200"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2">
                                        <IconMail className="h-4 w-4 text-primary" />
                                        Email Address
                                    </Label>
                                    <Input 
                                        id="email" 
                                        type="email" 
                                        placeholder="your@email.com" 
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="bg-background/50 border-border/50 focus:border-primary transition-all duration-200"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phoneNumber" className="text-sm font-semibold flex items-center gap-2">
                                        <IconPhone className="h-4 w-4 text-primary" />
                                        Phone Number
                                    </Label>
                                    <Input 
                                        id="phoneNumber" 
                                        placeholder="+1 (555) 000-0000" 
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        className="bg-background/50 border-border/50 focus:border-primary transition-all duration-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city" className="text-sm font-semibold flex items-center gap-2">
                                        <IconMapPin className="h-4 w-4 text-primary" />
                                        City
                                    </Label>
                                    <Input 
                                        id="city" 
                                        placeholder="e.g. New York" 
                                        value={formData.city}
                                        onChange={handleChange}
                                        className="bg-background/50 border-border/50 focus:border-primary transition-all duration-200"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="country" className="text-sm font-semibold flex items-center gap-2">
                                        <IconMapPin className="h-4 w-4 text-primary" />
                                        Country
                                    </Label>
                                    <Input 
                                        id="country" 
                                        placeholder="e.g. United States" 
                                        value={formData.country}
                                        onChange={handleChange}
                                        className="bg-background/50 border-border/50 focus:border-primary transition-all duration-200"
                                    />
                                </div>
                            </div>

                            <div className="pt-6 flex items-center justify-between border-t border-border/50">
                                <p className="text-xs text-muted-foreground italic">
                                    Last profile update: {new Date().toLocaleDateString()}
                                </p>
                                <Button 
                                    type="submit" 
                                    disabled={saving}
                                    className="px-8 bg-gradient-to-r from-primary to-primary/80"
                                >
                                    {saving ? (
                                        <>
                                            <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving Changes...
                                        </>
                                    ) : (
                                        "Save Profile Changes"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
