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
} from "lucide-react"
import { useTheme } from "next-themes"

export default function DashboardPage() {
  const { theme, setTheme } = useTheme()
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  
  const { user, logout, isAuthenticated } = useAuth()
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    cost: "",
    billingCycle: "Monthly",
    nextRenewal: "",
    paymentMethod: "",
    notes: "",
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
    } else {
      fetchDashboardData()
    }
  }, [isAuthenticated, router])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [subscriptionsData, statsData] = await Promise.all([
        apiClient.getSubscriptions(),
        apiClient.getDashboardStats().catch(() => null)
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
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIconForCategory = (category: string) => {
    const iconMap: { [key: string]: any } = {
      'Entertainment': Video,
      'Music': Music,
      'Design': Palette,
      'Storage': Cloud,
      'Gaming': Gamepad2,
      'default': CreditCard
    }
    return iconMap[category] || iconMap['default']
  }

  const getColorForCategory = (category: string) => {
    const colorMap: { [key: string]: string } = {
      'Entertainment': 'text-red-600',
      'Music': 'text-purple-600',
      'Design': 'text-blue-600',
      'Storage': 'text-green-600',
      'Gaming': 'text-orange-600',
      'default': 'text-primary'
    }
    return colorMap[category] || colorMap['default']
  }

  const calculateSummaryData = () => {
    if (!subscriptions.length) {
      return {
        monthlySpend: "0.00",
        annualSpend: "0.00",
        upcomingRenewals: 0,
        activeSubscriptions: 0,
      }
    }

    const monthlySpend = subscriptions.reduce((total, sub) => {
      switch (sub.billingCycle) {
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

    return {
      monthlySpend: monthlySpend.toFixed(2),
      annualSpend: (monthlySpend * 12).toFixed(2),
      upcomingRenewals: 0,
      activeSubscriptions: subscriptions.length,
    }
  }

  const summaryData = dashboardStats || calculateSummaryData()

  const handleAddSubscription = async () => {
    try {
      const subscriptionData = {
        serviceName: formData.name,
        category: formData.category,
        cost: parseFloat(formData.cost),
        billingCycle: formData.billingCycle,
        nextRenewalDate: formData.nextRenewal,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        active: true
      }

      const newSubscription = await apiClient.createSubscription(subscriptionData)
      await fetchDashboardData() // Refresh the data
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
    } catch (error) {
      console.error('Error adding subscription:', error)
    }
  }

  const handleDeleteSubscription = async (id: string | number) => {
    try {
      await apiClient.deleteSubscription(id.toString())
      await fetchDashboardData() // Refresh the data
    } catch (error) {
      console.error('Error deleting subscription:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
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
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="w-9 h-9"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="w-9 h-9">
              <Bell className="h-4 w-4" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-user.jpg" alt="User" />
                    <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email || 'user@example.com'}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
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
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back, {user?.name || 'User'}!</h2>
          <p className="text-muted-foreground">Here's an overview of your subscriptions</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${dashboardStats?.totalMonthlyCost?.toFixed(2) || summaryData.monthlySpend}
              </div>
              <p className="text-xs text-muted-foreground">Per month</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Annual Spend</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${((dashboardStats?.totalMonthlyCost || parseFloat(summaryData.monthlySpend)) * 12).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Per year</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Renewals</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {dashboardStats?.upcomingRenewals?.length || summaryData.upcomingRenewals}
              </div>
              <p className="text-xs text-muted-foreground">Next 7 days</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {dashboardStats?.totalSubscriptions || summaryData.activeSubscriptions}
              </div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>
        </div>

        {/* Subscriptions Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-foreground">Your Subscriptions</h3>
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
                    Add a new subscription to track your expenses.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
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
                    <Label htmlFor="billingCycle" className="text-right">
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
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Quarterly">Quarterly</SelectItem>
                        <SelectItem value="Yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="nextRenewal" className="text-right">
                      Next Renewal
                    </Label>
                    <Input
                      id="nextRenewal"
                      type="date"
                      value={formData.nextRenewal}
                      onChange={(e) => setFormData({ ...formData, nextRenewal: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="paymentMethod" className="text-right">
                      Payment Method
                    </Label>
                    <Input
                      id="paymentMethod"
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteSubscription(subscription.id || subscription._id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Cost</span>
                          <span className="font-medium text-foreground">
                            ${subscription.cost}/{subscription.billingCycle?.toLowerCase() || 'month'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Next renewal</span>
                          <span className="text-foreground">{subscription.nextRenewal}</span>
                        </div>
                        {subscription.paymentMethod && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Payment</span>
                            <span className="text-foreground">{subscription.paymentMethod}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
