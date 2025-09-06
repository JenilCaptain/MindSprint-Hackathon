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
  Gamepad,
  Cloud,
  Palette,
  MapPin,
  Car,
  Home,
  Shirt,
  Coffee,
  ShoppingCart,
  Smartphone,
  Laptop,
  Headphones,
  Camera,
  Play,
  Globe,
  BookOpen,
  Dumbbell,
} from "lucide-react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import Link from "next/link"

export default function Dashboard() {
  const [subscriptions, setSubscriptions] = useState([])
  const [dashboardStats, setDashboardStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState(null)
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

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
    } else {
      fetchDashboardData()
    }
  }, [isAuthenticated, router])

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

  // Dummy data for analytics charts (fallback)
  const categorySpendData = [
    { name: "Entertainment", value: 31.98, color: "hsl(var(--chart-1))" },
    { name: "Design", value: 52.99, color: "hsl(var(--chart-2))" },
    { name: "Music", value: 9.99, color: "hsl(var(--chart-3))" },
    { name: "Storage", value: 8.33, color: "hsl(var(--chart-4))" },
    { name: "Gaming", value: 14.99, color: "hsl(var(--chart-5))" },
  ]

  const monthlyTrendData = [
    { month: "Aug", spend: 98.45 },
    { month: "Sep", spend: 112.33 },
    { month: "Oct", spend: 125.67 },
    { month: "Nov", spend: 119.89 },
    { month: "Dec", spend: 134.22 },
    { month: "Jan", spend: 127.99 },
  ]

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [subscriptionsData, statsData] = await Promise.all([
        apiClient.getSubscriptions(),
        apiClient.getDashboardStats()
      ])
      
      setSubscriptions(subscriptionsData.subscriptions || [])
      setDashboardStats(statsData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Keep the empty array for subscriptions on error
      setSubscriptions([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddSubscription = async (e) => {
    e.preventDefault()
    try {
      const subscriptionData = {
        ...formData,
        cost: parseFloat(formData.cost),
        nextRenewalDate: formData.nextRenewal,
      }
      
      if (editingSubscription) {
        await apiClient.updateSubscription(editingSubscription._id, subscriptionData)
      } else {
        await apiClient.createSubscription(subscriptionData)
      }
      
      await fetchDashboardData()
      setIsAddModalOpen(false)
      setEditingSubscription(null)
      setFormData({
        name: "",
        category: "",
        cost: "",
        billingCycle: "Monthly",
        nextRenewal: "",
        paymentMethod: "",
        notes: "",
      })
    } catch (error) {
      console.error('Error saving subscription:', error)
      alert('Error saving subscription. Please try again.')
    }
  }

  const handleEditSubscription = (subscription) => {
    setEditingSubscription(subscription)
    setFormData({
      name: subscription.name,
      category: subscription.category,
      cost: subscription.cost.toString(),
      billingCycle: subscription.billingCycle,
      nextRenewal: subscription.nextRenewalDate?.split('T')[0] || '',
      paymentMethod: subscription.paymentMethod || '',
      notes: subscription.notes || '',
    })
    setIsAddModalOpen(true)
  }

  const handleDeleteSubscription = async (subscriptionId) => {
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      try {
        await apiClient.deleteSubscription(subscriptionId)
        await fetchDashboardData()
      } catch (error) {
        console.error('Error deleting subscription:', error)
        alert('Error deleting subscription. Please try again.')
      }
    }
  }

  const getCategoryIcon = (category) => {
    const iconMap = {
      Entertainment: Video,
      Music: Music,
      Gaming: Gamepad,
      Storage: Cloud,
      Design: Palette,
      Transportation: Car,
      Housing: Home,
      Fashion: Shirt,
      Food: Coffee,
      Shopping: ShoppingCart,
      Technology: Smartphone,
      Education: BookOpen,
      Health: Dumbbell,
      Travel: MapPin,
      default: Globe
    }
    const IconComponent = iconMap[category] || iconMap.default
    return <IconComponent className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center space-x-4">
            <Zap className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">SubTrackr</h1>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-user.jpg" alt="User" />
                    <AvatarFallback>{user?.name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || 'user@example.com'}
                    </p>
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

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${dashboardStats?.totalMonthlyCost?.toFixed(2) || summaryData.monthlySpend}
              </div>
              <p className="text-xs text-muted-foreground">Across all subscriptions</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Annual Spend</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${((dashboardStats?.totalMonthlyCost || parseFloat(summaryData.monthlySpend)) * 12).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Projected yearly cost</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Renewals</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardStats?.upcomingRenewals?.length || summaryData.upcomingRenewals}
              </div>
              <p className="text-xs text-muted-foreground">In the next 7 days</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardStats?.totalSubscriptions || summaryData.activeSubscriptions}
              </div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  entertainment: {
                    label: "Entertainment",
                    color: "hsl(var(--chart-1))",
                  },
                  design: {
                    label: "Design",
                    color: "hsl(var(--chart-2))",
                  },
                  music: {
                    label: "Music",
                    color: "hsl(var(--chart-3))",
                  },
                  storage: {
                    label: "Storage",
                    color: "hsl(var(--chart-4))",
                  },
                  gaming: {
                    label: "Gaming",
                    color: "hsl(var(--chart-5))",
                  },
                }}
                className="mx-auto aspect-square max-h-[250px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={categorySpendData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    strokeWidth={5}
                  >
                    {categorySpendData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  spend: {
                    label: "Monthly Spend",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[250px]"
              >
                <BarChart data={monthlyTrendData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dashed" />}
                  />
                  <Bar dataKey="spend" fill="var(--color-spend)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Subscriptions Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your Subscriptions</CardTitle>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Subscription
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {subscriptions.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No subscriptions</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding your first subscription.</p>
                <div className="mt-6">
                  <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Subscription
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {subscriptions.map((subscription) => (
                  <div key={subscription._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        {getCategoryIcon(subscription.category)}
                      </div>
                      <div>
                        <h3 className="font-medium">{subscription.name}</h3>
                        <p className="text-sm text-muted-foreground">{subscription.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">${subscription.cost}</p>
                        <p className="text-sm text-muted-foreground">{subscription.billingCycle}</p>
                      </div>
                      <Badge variant="outline">
                        {new Date(subscription.nextRenewalDate).toLocaleDateString()}
                      </Badge>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditSubscription(subscription)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSubscription(subscription._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add/Edit Subscription Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingSubscription ? 'Edit Subscription' : 'Add New Subscription'}
            </DialogTitle>
            <DialogDescription>
              {editingSubscription 
                ? 'Update your subscription details below.' 
                : 'Add a new subscription to track your spending.'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubscription}>
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
                  required
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
                    <SelectItem value="Gaming">Gaming</SelectItem>
                    <SelectItem value="Storage">Storage</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
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
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="billingCycle" className="text-right">
                  Billing
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
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="paymentMethod" className="text-right">
                  Payment
                </Label>
                <Input
                  id="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="col-span-3"
                  placeholder="Credit Card, PayPal, etc."
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
                  placeholder="Optional notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">
                {editingSubscription ? 'Update' : 'Add'} Subscription
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
