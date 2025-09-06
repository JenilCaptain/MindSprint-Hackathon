"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Zap,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
  DollarSign,
  Calendar,
  CreditCard,
  TrendingUp,
  Plus,
  Bell,
  Edit,
  Trash2,
  Grid3X3,
  List,
  Music,
  Video,
  Palette,
  Cloud,
  Gamepad2,
  Mail,
} from "lucide-react"
import { useTheme } from "next-themes"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts"
import Link from "next/link"

  // Dummy subscription data (fallback)
  const dummySubscriptions = [
  {
    id: 1,
    name: "Spotify Premium",
    category: "Music",
    cost: 9.99,
    billingCycle: "Monthly",
    nextRenewal: "2024-01-15",
    paymentMethod: "Visa ****1234",
    icon: Music,
    color: "text-green-500",
  },
  {
    id: 2,
    name: "Netflix",
    category: "Entertainment",
    cost: 15.99,
    billingCycle: "Monthly",
    nextRenewal: "2024-01-17",
    paymentMethod: "Mastercard ****5678",
    icon: Video,
    color: "text-red-500",
  },
  {
    id: 3,
    name: "Adobe Creative Cloud",
    category: "Design",
    cost: 52.99,
    billingCycle: "Monthly",
    nextRenewal: "2024-01-20",
    paymentMethod: "Visa ****1234",
    icon: Palette,
    color: "text-blue-500",
  },
  {
    id: 4,
    name: "Google Drive",
    category: "Storage",
    cost: 99.99,
    billingCycle: "Yearly",
    nextRenewal: "2024-06-15",
    paymentMethod: "PayPal",
    icon: Cloud,
    color: "text-yellow-500",
  },
  {
    id: 5,
    name: "Xbox Game Pass",
    category: "Gaming",
    cost: 14.99,
    billingCycle: "Monthly",
    nextRenewal: "2024-01-22",
    paymentMethod: "Visa ****1234",
    icon: Gamepad2,
    color: "text-green-600",
  },
]

export default function DashboardPage() {
  const { theme, setTheme } = useTheme()
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards")
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [notificationCount, setNotificationCount] = useState<number>(0)
  const [testEmailLoading, setTestEmailLoading] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    cost: "",
    billingCycle: "Monthly",
    nextRenewal: "",
    paymentMethod: "",
    notes: "",
  })
  
  const { user, logout, isAuthenticated } = useAuth()
  const router = useRouter()

  // Calculate summary data from actual subscriptions
  const calculateSummaryData = () => {
    if (!subscriptions.length) {
      return {
        monthlySpend: 0,
        annualSpend: 0,
        upcomingRenewals: 0,
        activeSubscriptions: 0,
      }
    }

    const monthlySpend = subscriptions.reduce((total, sub) => {
      switch (sub.billingCycle) {
        case 'Weekly':
          return total + (sub.cost * 4.33) // Average weeks per month
        case 'Monthly':
          return total + sub.cost
        case 'Quarterly':
          return total + (sub.cost / 3)
        case 'Yearly':
          return total + (sub.cost / 12)
        default:
          return total + sub.cost
      }
    }, 0)

    const annualSpend = monthlySpend * 12

    // Calculate upcoming renewals (next 7 days)
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    const upcomingRenewals = subscriptions.filter(sub => {
      if (!sub.nextRenewalDate && !sub.nextRenewal) return false
      const renewalDate = new Date(sub.nextRenewalDate || sub.nextRenewal)
      return renewalDate >= today && renewalDate <= nextWeek
    }).length

    return {
      monthlySpend: monthlySpend.toFixed(2),
      annualSpend: annualSpend.toFixed(2),
      upcomingRenewals,
      activeSubscriptions: subscriptions.length,
    }
  }

  const summaryData = calculateSummaryData()

  // Calculate upcoming renewals list from actual subscriptions
  const getUpcomingRenewals = () => {
    if (!subscriptions.length) return []
    
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    return subscriptions
      .filter((sub: any) => {
        if (!sub.nextRenewalDate && !sub.nextRenewal) return false
        const renewalDate = new Date(sub.nextRenewalDate || sub.nextRenewal)
        return renewalDate >= today && renewalDate <= nextWeek
      })
      .map((sub: any) => {
        const renewalDate = new Date(sub.nextRenewalDate || sub.nextRenewal)
        const daysLeft = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return {
          id: sub.id,
          name: sub.name || sub.serviceName,
          cost: sub.cost,
          renewalDate: renewalDate.toLocaleDateString(),
          daysLeft: Math.max(0, daysLeft)
        }
      })
      .sort((a: any, b: any) => a.daysLeft - b.daysLeft)
  }

  const upcomingRenewals = getUpcomingRenewals()

  // Generate category spending data from actual subscriptions
  const getCategorySpendData = () => {
    if (!subscriptions.length) return []
    
    const categoryTotals: { [key: string]: number } = {}
    
    subscriptions.forEach((sub: any) => {
      const category = sub.category || 'Other'
      const monthlyAmount = sub.billingCycle === 'Weekly' ? sub.cost * 4.33 :
                          sub.billingCycle === 'Monthly' ? sub.cost : 
                          sub.billingCycle === 'Yearly' ? sub.cost / 12 :
                          sub.billingCycle === 'Quarterly' ? sub.cost / 3 : sub.cost
      
      categoryTotals[category] = (categoryTotals[category] || 0) + monthlyAmount
    })
    
    const colors = [
      "hsl(var(--chart-1))",
      "hsl(var(--chart-2))", 
      "hsl(var(--chart-3))",
      "hsl(var(--chart-4))",
      "hsl(var(--chart-5))"
    ]
    
    return Object.entries(categoryTotals).map(([name, value], index) => ({
      name,
      value: Number(value.toFixed(2)),
      color: colors[index % colors.length]
    }))
  }

  const categorySpendData = getCategorySpendData()

  // Generate monthly trend data (simplified for now - can be enhanced later)
  const monthlyTrendData = [
    { month: "Aug", spend: 98.45 },
    { month: "Sep", spend: 112.33 },
    { month: "Oct", spend: 125.67 },
    { month: "Nov", spend: 119.89 },
    { month: "Dec", spend: 134.22 },
    { month: "Jan", spend: 127.99 },
  ]

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
    } else {
      fetchDashboardData()
    }
  }, [isAuthenticated, router])

  // Debug user state
  useEffect(() => {
    console.log('Dashboard - User state:', user)
    console.log('Dashboard - Is authenticated:', isAuthenticated)
  }, [user, isAuthenticated])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [subscriptionsData, statsData, notificationCountData] = await Promise.all([
        apiClient.getSubscriptions(),
        apiClient.getDashboardStats().catch(() => null), // Handle if endpoint doesn't exist
        apiClient.getUnreadNotificationCount().catch(() => ({ count: 0 }))
      ])
      
      // Map backend subscriptions to frontend format
      const mappedSubscriptions = subscriptionsData.map((sub: any) => ({
        ...sub,
        id: sub._id,
        name: sub.serviceName,
        nextRenewal: sub.nextRenewalDate ? new Date(sub.nextRenewalDate).toLocaleDateString() : 'N/A',
        icon: getIconForCategory(sub.category),
        color: getColorForCategory(sub.category)
      }))
      
      setSubscriptions(mappedSubscriptions)
      setDashboardStats(statsData)
      setNotificationCount(notificationCountData.count)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // On error, show empty state rather than dummy data
      setSubscriptions([])
      setNotificationCount(0)
    } finally {
      setLoading(false)
    }
  }

  // Helper functions to assign icons and colors based on category
  const getIconForCategory = (category: string) => {
    const iconMap: { [key: string]: any } = {
      'Entertainment': Video,
      'Music': Music,
      'Design': Palette,
      'Storage': Cloud,
      'Gaming': Gamepad2,
      'Productivity': CreditCard,
      'Utilities': Settings,
      'News': CreditCard,
      'Health': CreditCard,
      'Education': CreditCard,
      'default': CreditCard
    }
    return iconMap[category] || iconMap['default']
  }

  const getColorForCategory = (category: string) => {
    const colorMap: { [key: string]: string } = {
      'Entertainment': 'text-red-600',
      'Music': 'text-pink-600',
      'Design': 'text-purple-600',
      'Storage': 'text-blue-600',
      'Gaming': 'text-orange-600',
      'Productivity': 'text-indigo-600',
      'Utilities': 'text-gray-600',
      'News': 'text-yellow-600',
      'Health': 'text-green-600',
      'Other': 'text-gray-500'
    }
    return colorMap[category] || 'text-gray-500'
  }

  const handleAddSubscription = async () => {
    try {
      // Form validation
      if (!formData.name.trim()) {
        alert('Please enter a service name')
        return
      }
      if (!formData.category) {
        alert('Please select a category')
        return
      }
      if (!formData.cost || isNaN(Number.parseFloat(formData.cost)) || Number.parseFloat(formData.cost) <= 0) {
        alert('Please enter a valid cost')
        return
      }
      if (!formData.nextRenewal) {
        alert('Please select a renewal date')
        return
      }
      if (!formData.paymentMethod.trim()) {
        alert('Please enter a payment method')
        return
      }

      const subscriptionData = {
        serviceName: formData.name,
        category: formData.category,
        cost: Number.parseFloat(formData.cost),
        billingCycle: formData.billingCycle,
        nextRenewalDate: formData.nextRenewal,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        active: true
      }

      const newSubscription = await apiClient.createSubscription(subscriptionData)
      
      // Add icon and color for display (these are frontend-only properties)
      const displaySubscription = {
        ...newSubscription,
        id: newSubscription._id,
        name: newSubscription.serviceName,
        nextRenewal: newSubscription.nextRenewalDate ? new Date(newSubscription.nextRenewalDate).toLocaleDateString() : 'N/A',
        icon: getIconForCategory(newSubscription.category),
        color: getColorForCategory(newSubscription.category)
      }
      
      setSubscriptions([...subscriptions, displaySubscription])
      setFormData({
        name: "",
        category: "",
        cost: "",
        billingCycle: "Monthly",
        nextRenewal: "",
        paymentMethod: "",
        notes: "",
      })
      setIsAddModalOpen(false)
      
      // Show success message
      alert('Subscription added successfully!')
    } catch (error: any) {
      console.error('Error adding subscription:', error)
      alert(`Failed to add subscription: ${error?.message || 'Unknown error'}`)
    }
  }

  const handleDeleteSubscription = async (id: string | number) => {
    try {
      await apiClient.deleteSubscription(id.toString())
      setSubscriptions(subscriptions.filter((sub) => sub.id !== id && sub._id !== id))
    } catch (error) {
      console.error('Error deleting subscription:', error)
      // You might want to show an error message to the user here
    }
  }

  const handleTestEmail = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/subscriptions/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userEmail: user?.email || 'test@example.com',
          userName: user?.name || 'Test User'
        })
      })

      if (response.ok) {
        alert('Test email sent successfully! Check your inbox.')
      } else {
        const error = await response.json()
        alert(`Failed to send test email: ${error.message}`)
      }
    } catch (error) {
      console.error('Error sending test email:', error)
      alert('Failed to send test email. Please check the console for details.')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      ) : (
        <>
      {/* Top Navbar */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="flex h-16 items-center justify-between px-6">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">SubTrackr</h1>
          </div>

          {/* Right side - Theme toggle, notifications, user menu */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-9 h-9 p-0"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Notifications */}
            <Link href="/notifications">
              <Button variant="ghost" size="sm" className="w-9 h-9 p-0 relative">
                <Bell className="h-4 w-4" />
                {notificationCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs bg-destructive text-destructive-foreground">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Test Email Button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleTestEmail}
              className="hidden sm:flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Test Email
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="/diverse-user-avatars.png" alt="User" />
                    <AvatarFallback>
                      {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email || 'user@example.com'}</p>
                    {/* Debug info */}
                    <p className="text-xs text-blue-500">Debug: {JSON.stringify({name: user?.name, email: user?.email})}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 space-y-6">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-foreground">Welcome back, {user?.name || 'User'}!</h2>
          <p className="text-muted-foreground">Here's an overview of your subscription spending</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Monthly Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${dashboardStats?.totalMonthlyCost?.toFixed(2) || summaryData.monthlySpend}
              </div>
              <p className="text-xs text-muted-foreground">
                {subscriptions.length > 0 ? `Based on ${subscriptions.length} active subscriptions` : 'No subscriptions yet'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Annual Spend</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${((dashboardStats?.totalMonthlyCost || parseFloat(summaryData.monthlySpend)) * 12).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Projected for this year</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Renewals</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {dashboardStats?.upcomingRenewals?.length || summaryData.upcomingRenewals}
              </div>
              <p className="text-xs text-muted-foreground">
                {summaryData.upcomingRenewals === 0 ? 'No renewals due soon' : 'Next 7 days'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {dashboardStats?.totalSubscriptions || summaryData.activeSubscriptions}
              </div>
              <p className="text-xs text-muted-foreground">
                {summaryData.activeSubscriptions === 0 ? 'No subscriptions yet' : 'Currently active'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Section - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Subscription List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-foreground">Your Subscriptions</h3>
              <div className="flex items-center space-x-2">
                <div className="flex items-center border border-border rounded-lg p-1">
                  <Button
                    variant={viewMode === "cards" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("cards")}
                    className="h-8 w-8 p-0"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                    className="h-8 w-8 p-0"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
                <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Subscription
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add New Subscription</DialogTitle>
                      <DialogDescription>
                        Enter the details of your new subscription to start tracking it.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Service Name
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="col-span-3"
                          placeholder="e.g., Netflix"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">
                          Category
                        </Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Entertainment">Entertainment</SelectItem>
                            <SelectItem value="Music">Music</SelectItem>
                            <SelectItem value="Design">Design</SelectItem>
                            <SelectItem value="Storage">Storage</SelectItem>
                            <SelectItem value="Gaming">Gaming</SelectItem>
                            <SelectItem value="Productivity">Productivity</SelectItem>
                            <SelectItem value="Utilities">Utilities</SelectItem>
                            <SelectItem value="News">News</SelectItem>
                            <SelectItem value="Health">Health</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cost" className="text-right">
                          Cost
                        </Label>
                        <Input
                          id="cost"
                          type="number"
                          step="0.01"
                          value={formData.cost}
                          onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                          className="col-span-3"
                          placeholder="9.99"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="billing" className="text-right">
                          Billing Cycle
                        </Label>
                        <Select
                          value={formData.billingCycle}
                          onValueChange={(value) => setFormData({ ...formData, billingCycle: value })}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Weekly">Weekly</SelectItem>
                            <SelectItem value="Monthly">Monthly</SelectItem>
                            <SelectItem value="Quarterly">Quarterly</SelectItem>
                            <SelectItem value="Yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="renewal" className="text-right">
                          Next Renewal
                        </Label>
                        <Input
                          id="renewal"
                          type="date"
                          value={formData.nextRenewal}
                          onChange={(e) => setFormData({ ...formData, nextRenewal: e.target.value })}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="payment" className="text-right">
                          Payment Method
                        </Label>
                        <Input
                          id="payment"
                          value={formData.paymentMethod}
                          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                          className="col-span-3"
                          placeholder="Visa ****1234"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="notes" className="text-right">
                          Notes
                        </Label>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          className="col-span-3"
                          placeholder="Optional notes..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={handleAddSubscription}>
                        Add Subscription
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {subscriptions.length === 0 ? (
              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-foreground mb-2">No subscriptions yet</h4>
                    <p className="text-muted-foreground mb-4">Start tracking your subscriptions to get insights</p>
                    <Button
                      variant="outline"
                      className="border-border bg-transparent"
                      onClick={() => setIsAddModalOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Subscription
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : viewMode === "cards" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subscriptions.map((subscription) => {
                  const IconComponent = subscription.icon
                  return (
                    <Card key={subscription.id} className="border-border/50 bg-card/50 backdrop-blur">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                              <IconComponent className={`w-5 h-5 ${subscription.color}`} />
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground">{subscription.name}</h4>
                              <p className="text-sm text-muted-foreground">{subscription.category}</p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 5v.01M12 12v.01M12 19v.01"
                                  />
                                </svg>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteSubscription(subscription.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Cost:</span>
                            <span className="font-medium text-foreground">
                              ${subscription.cost}/{subscription.billingCycle.toLowerCase()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Next Renewal:</span>
                            <span className="text-foreground">{subscription.nextRenewal}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Payment:</span>
                            <span className="text-foreground">{subscription.paymentMethod}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Billing Cycle</TableHead>
                      <TableHead>Next Renewal</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((subscription) => {
                      const IconComponent = subscription.icon
                      return (
                        <TableRow key={subscription.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                                <IconComponent className={`w-4 h-4 ${subscription.color}`} />
                              </div>
                              <span>{subscription.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{subscription.category}</TableCell>
                          <TableCell>${subscription.cost}</TableCell>
                          <TableCell>{subscription.billingCycle}</TableCell>
                          <TableCell>{subscription.nextRenewal}</TableCell>
                          <TableCell>{subscription.paymentMethod}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 5v.01M12 12v.01M12 19v.01"
                                    />
                                  </svg>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteSubscription(subscription.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>

          {/* Right Column - Upcoming Renewals */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">Upcoming Renewals</h3>
            <div className="space-y-3">
              {upcomingRenewals.length > 0 ? (
                upcomingRenewals.map((renewal) => (
                  <Card key={renewal.id} className="border-border/50 bg-card/50 backdrop-blur">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-foreground">{renewal.name}</h4>
                        <Badge variant={renewal.daysLeft <= 3 ? "destructive" : "secondary"}>{renewal.daysLeft}d</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{renewal.renewalDate}</span>
                        <span className="font-medium text-foreground">${renewal.cost}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-border/50 bg-card/50 backdrop-blur">
                  <CardContent className="p-6">
                    <div className="text-center py-6">
                      <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">No upcoming renewals in the next 7 days</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Analytics & Charts Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">Analytics & Insights</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spending by Category - Pie Chart */}
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">Spending by Category</CardTitle>
                <p className="text-sm text-muted-foreground">Monthly breakdown of your subscription costs</p>
              </CardHeader>
              <CardContent>
                {categorySpendData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categorySpendData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent ? (percent * 100).toFixed(0) : 0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categorySpendData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`$${value}`, "Monthly Cost"]}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            color: "hsl(var(--card-foreground))",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                      <Palette className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No category data available</p>
                      <p className="text-sm text-muted-foreground">Add subscriptions to see category breakdown</p>
                    </div>
                  </div>
                )}
                <div className="mt-4 space-y-2">
                  {categorySpendData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-foreground">{item.name}</span>
                      </div>
                      <span className="font-medium text-foreground">${item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Spend Trend - Line Chart */}
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">Monthly Spend Trend</CardTitle>
                <p className="text-sm text-muted-foreground">Your subscription spending over the last 6 months</p>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip
                        formatter={(value) => [`$${value}`, "Monthly Spend"]}
                        labelFormatter={(label) => `Month: ${label}`}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--card-foreground))",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="spend"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Monthly Spending</span>
                  </div>
                  <div className="text-right">
                    <p className="text-foreground font-medium">Avg: $118.26</p>
                    <p className="text-muted-foreground">6-month average</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Spend Bar Chart */}
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">Monthly Comparison</CardTitle>
                <p className="text-sm text-muted-foreground">Compare your spending across recent months</p>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip
                        formatter={(value) => [`$${value}`, "Monthly Spend"]}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--card-foreground))",
                        }}
                      />
                      <Bar dataKey="spend" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">Quick Stats</CardTitle>
                <p className="text-sm text-muted-foreground">Key insights about your subscriptions</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Most Expensive</p>
                    <p className="font-medium text-foreground">Adobe Creative Cloud</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">$52.99</p>
                    <p className="text-xs text-muted-foreground">per month</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Cheapest</p>
                    <p className="font-medium text-foreground">Google Drive</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">$8.33</p>
                    <p className="text-xs text-muted-foreground">per month</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Next Renewal</p>
                    <p className="font-medium text-foreground">Spotify Premium</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">2 days</p>
                    <p className="text-xs text-muted-foreground">Jan 15, 2024</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Monthly Cost</p>
                    <p className="font-medium text-foreground">Per Subscription</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">$25.60</p>
                    <p className="text-xs text-muted-foreground">average</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      </>
      )}
    </div>
  )
}
