"use client"

import * as React from "react"
import Link from "next/link"
import {
    IconBell,
    IconCheck,
    IconTrash,
    IconInfoCircle,
    IconAlertTriangle,
    IconCircleCheck,
    IconMail,
    IconArchive,
    IconDotsVertical,
    IconFilter,
    IconSearch,
    IconClock,
    IconSettings
} from "@tabler/icons-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"

// Dummy Notification Data
const initialNotifications = [
    {
        id: "1",
        title: "New Leave Request",
        description: "John Doe has requested 2 days of sick leave. Please review and approve.",
        content: "Employee John Doe (ID: 1023) has submitted a leave request for Feb 14-15 due to a medical checkup. Attached is a doctor's note. Please review the team calendar before approving.",
        time: "5 mins ago",
        type: "alert",
        unread: true,
        isArchived: false,
        sender: { name: "John Doe", avatar: "/avatars/01.png", fallback: "JD" },
        category: "HR"
    },
    {
        id: "2",
        title: "Payroll Processed Successfully",
        description: "The payroll for January 2026 has been processed. Disbursements pending.",
        content: "Batch #PAY-2026-01 completed successfully. Total salaries processed: $45,230. bank transfers are scheduled for tomorrow, Feb 1st, at 9:00 AM.",
        time: "2 hours ago",
        type: "success",
        unread: false,
        isArchived: false,
        sender: { name: "System", avatar: "", fallback: "SY" },
        category: "Finance"
    },
    {
        id: "3",
        title: "Server Maintenance Scheduled",
        description: "Routine maintenance is scheduled for Sunday at 02:00 AM UTC.",
        content: "The main database server will undergo maintenance for approximately 45 minutes. All systems will be temporarily unavailable during this window.",
        time: "1 day ago",
        type: "info",
        unread: false,
        isArchived: true,
        sender: { name: "DevOps", avatar: "", fallback: "DO" },
        category: "System"
    },
    {
        id: "4",
        title: "New Production Order",
        description: "PO-9988 has been created by Merchandising team.",
        content: "New PO-9988 for Buyer 'H&M' has been initiated. Style: ST-5050. Total Quantity: 12,000 pcs. Target Shipment Date: March 15th.",
        time: "1 day ago",
        type: "info",
        unread: true,
        isArchived: false,
        sender: { name: "Sarah Smith", avatar: "/avatars/03.png", fallback: "SS" },
        category: "Production"
    },
    {
        id: "5",
        title: "Machine Breakdown",
        description: "Cutting Machine #4 reported a critical failure.",
        content: "Urgent: Cutting Machine #4 (Model X-200) has stopped working due to a motor failure. Maintenance team has been notified but production on Line A is halted.",
        time: "2 days ago",
        type: "error",
        unread: true,
        isArchived: false,
        sender: { name: "Floor Manager", avatar: "", fallback: "FM" },
        category: "Maintenance"
    },
    {
        id: "6",
        title: "Welcome to HR Hub",
        description: "Your account has been successfully verified. Get started by setting up your profile.",
        content: "Welcome, Shakil! Your account is now fully active. We recommend setting up 2FA in your settings and completing your user profile.",
        time: "1 week ago",
        type: "info",
        unread: false,
        isArchived: false,
        sender: { name: "Admin", avatar: "", fallback: "AD" },
        category: "General"
    }
]

export default function NotificationsPage() {
    const [notifications, setNotifications] = React.useState(initialNotifications)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [activeTab, setActiveTab] = React.useState("all")
    const [selectedNotification, setSelectedNotification] = React.useState<any>(null)
    const [detailsOpen, setDetailsOpen] = React.useState(false)

    const filteredNotifications = notifications.filter(n => {
        const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.description.toLowerCase().includes(searchTerm.toLowerCase())

        if (activeTab === "all") return matchesSearch && !n.isArchived
        if (activeTab === "unread") return matchesSearch && n.unread && !n.isArchived
        if (activeTab === "archived") return matchesSearch && n.isArchived
        return matchesSearch
    })

    const markAsRead = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation()
        setNotifications(notifications.map(n => n.id === id ? { ...n, unread: false } : n))
    }

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, unread: false })))
        toast.success("All notifications marked as read")
    }

    const archiveNotification = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation()
        setNotifications(notifications.map(n => n.id === id ? { ...n, isArchived: true } : n))
        toast.info("Notification archived")
    }

    const deleteNotification = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation()
        setNotifications(notifications.filter(n => n.id !== id))
        toast.success("Notification deleted")
    }

    const handleViewDetails = (notification: any) => {
        setSelectedNotification(notification)
        if (notification.unread) {
            markAsRead(notification.id)
        }
        setDetailsOpen(true)
    }

    const getIcon = (type: string) => {
        switch (type) {
            case "alert": return <IconAlertTriangle className="size-5 text-amber-500" />
            case "success": return <IconCircleCheck className="size-5 text-emerald-500" />
            case "error": return <IconAlertTriangle className="size-5 text-red-500" />
            default: return <IconInfoCircle className="size-5 text-blue-500" />
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-muted/5">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-background sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <IconBell className="size-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Notifications</h1>
                        <p className="text-sm text-muted-foreground">Manage your alerts and messages</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={markAllAsRead}>
                        <IconCheck className="mr-2 size-4" />
                        Mark all as read
                    </Button>
                    <Link href="/settings">
                        <Button variant="outline" size="icon" className="h-9 w-9" title="Notification Settings">
                            <IconSettings className="size-4" />
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Sidebar Filter */}
                <div className="w-full md:w-64 border-r bg-background/50 p-4 hidden md:block">
                    <div className="space-y-4">
                        <div className="font-semibold text-sm px-2">Filters</div>
                        <nav className="space-y-1">
                            {[
                                { label: "All", value: "all", icon: IconMail },
                                { label: "Unread", value: "unread", icon: IconBell },
                                { label: "Archived", value: "archived", icon: IconArchive }
                            ].map((item) => (
                                <Button
                                    key={item.value}
                                    variant={activeTab === item.value ? "secondary" : "ghost"}
                                    className="w-full justify-start font-normal"
                                    onClick={() => setActiveTab(item.value)}
                                >
                                    <item.icon className="mr-2 size-4" />
                                    {item.label}
                                    {item.value === "unread" && notifications.filter(n => n.unread && !n.isArchived).length > 0 && (
                                        <Badge variant="secondary" className="ml-auto text-xs h-5 px-1.5 min-w-[1.25rem] flex items-center justify-center">
                                            {notifications.filter(n => n.unread && !n.isArchived).length}
                                        </Badge>
                                    )}
                                </Button>
                            ))}
                        </nav>

                        <Separator />

                        <div className="font-semibold text-sm px-2">Categories</div>
                        <nav className="space-y-1">
                            {["System", "HR", "Finance", "Production", "Maintenance"].map((cat) => (
                                <Button key={cat} variant="ghost" className="w-full justify-start font-normal text-muted-foreground">
                                    <span className={`mr-2 h-2 w-2 rounded-full ${cat === 'HR' ? 'bg-purple-500' :
                                        cat === 'Finance' ? 'bg-green-500' :
                                            cat === 'Production' ? 'bg-blue-500' :
                                                cat === 'Maintenance' ? 'bg-red-500' :
                                                    'bg-gray-500'
                                        }`} />
                                    {cat}
                                </Button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0 bg-background">
                    <div className="p-4 border-b flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search notifications..."
                                className="pl-9 bg-muted/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                            <Select defaultValue="newest">
                                <SelectTrigger className="w-[140px] h-9">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">Newest first</SelectItem>
                                    <SelectItem value="oldest">Oldest first</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="flex flex-col">
                            {filteredNotifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground">
                                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                        <IconBell className="size-8 text-muted-foreground/50" />
                                    </div>
                                    <p className="text-lg font-medium">No notifications found</p>
                                    <p className="text-sm">You're all caught up!</p>
                                </div>
                            ) : (
                                filteredNotifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleViewDetails(notification)}
                                        className={cn(
                                            "group flex items-start gap-4 p-4 border-b hover:bg-muted/30 transition-colors relative cursor-pointer",
                                            notification.unread ? "bg-primary/5 hover:bg-primary/10" : "bg-background"
                                        )}
                                    >
                                        <div className="mt-1">
                                            {notification.sender.avatar ? (
                                                <Avatar className="h-10 w-10 border">
                                                    <AvatarImage src={notification.sender.avatar} />
                                                    <AvatarFallback>{notification.sender.fallback}</AvatarFallback>
                                                </Avatar>
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border">
                                                    {getIcon(notification.type)}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-sm truncate">{notification.title}</span>
                                                    <Badge variant="outline" className="text-[10px] h-4 font-normal text-muted-foreground">
                                                        {notification.category}
                                                    </Badge>
                                                    {notification.unread && (
                                                        <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                                                    <IconClock className="size-3" />
                                                    {notification.time}
                                                </span>
                                            </div>
                                            <p className="text-sm text-foreground/80 line-clamp-2">
                                                {notification.description}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm p-1 rounded-md shadow-sm">
                                            {notification.unread && (
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={(e) => markAsRead(notification.id, e)} title="Mark as read">
                                                    <IconCheck className="size-4" />
                                                </Button>
                                            )}
                                            {!notification.isArchived && (
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600" onClick={(e) => archiveNotification(notification.id, e)} title="Archive">
                                                    <IconArchive className="size-4" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => deleteNotification(notification.id, e)} title="Delete">
                                                <IconTrash className="size-4" />
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                                        <IconDotsVertical className="size-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewDetails(notification); }}>View Details</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast.info("Category muted"); }}>Mute this category</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
                <SheetContent className="sm:max-w-md w-full">
                    <SheetHeader>
                        <SheetTitle>Notification Details</SheetTitle>
                        <SheetDescription>
                            Full details of the selected notification.
                        </SheetDescription>
                    </SheetHeader>
                    {selectedNotification && (
                        <div className="flex flex-col gap-6 py-6">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border">
                                    <AvatarImage src={selectedNotification.sender.avatar} />
                                    <AvatarFallback>{selectedNotification.sender.fallback}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="font-semibold text-lg">{selectedNotification.sender.name}</h4>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">{selectedNotification.category}</Badge>
                                        <span className="text-xs text-muted-foreground">{selectedNotification.time}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={`p-4 rounded-lg flex items-start gap-3 border ${selectedNotification.type === 'alert' ? 'bg-amber-50 border-amber-100 text-amber-900' :
                                selectedNotification.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-900' :
                                    selectedNotification.type === 'error' ? 'bg-red-50 border-red-100 text-red-900' :
                                        'bg-blue-50 border-blue-100 text-blue-900'
                                }`}>
                                <div className="mt-0.5">
                                    {getIcon(selectedNotification.type)}
                                </div>
                                <div>
                                    <h5 className="font-bold text-sm mb-1">{selectedNotification.title}</h5>
                                    <p className="text-sm opacity-90">{selectedNotification.description}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h5 className="font-semibold text-sm">Content</h5>
                                <p className="text-sm text-foreground/80 leading-relaxed">
                                    {selectedNotification.content || "No additional content."}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h5 className="font-semibold text-sm">Actions</h5>
                                <div className="flex gap-2">
                                    {!selectedNotification.isArchived ? (
                                        <Button size="sm" variant="outline" onClick={() => { archiveNotification(selectedNotification.id); setDetailsOpen(false); }}>
                                            <IconArchive className="mr-2 size-4" /> Archive
                                        </Button>
                                    ) : (
                                        <Button size="sm" variant="outline" disabled>
                                            <IconArchive className="mr-2 size-4" /> Archived
                                        </Button>
                                    )}
                                    <Button size="sm" variant="destructive" onClick={() => { deleteNotification(selectedNotification.id); setDetailsOpen(false); }}>
                                        <IconTrash className="mr-2 size-4" /> Delete
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    )
}
