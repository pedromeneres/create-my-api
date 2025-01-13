import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle } from "lucide-react";

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  plate_number: string;
}

const formSchema = z.object({
  carId: z.string({
    required_error: "Please select a car",
  }),
  date: z.date({
    required_error: "Please select a date",
  }),
  startTime: z.string({
    required_error: "Please select a start time",
  }),
  endTime: z.string({
    required_error: "Please select an end time",
  }),
  purpose: z.string().min(1, "Purpose is required"),
});

type ReservationFormValues = z.infer<typeof formSchema>;

interface NewReservationDialogProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  selectedCarId?: string | null;
}

export function NewReservationDialog({ 
  isOpen, 
  onOpenChange,
  selectedCarId 
}: NewReservationDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startTime: "",
      endTime: "",
      purpose: "",
      carId: selectedCarId || "",
    },
  });

  // Update form when selectedCarId changes
  useEffect(() => {
    if (selectedCarId) {
      form.setValue('carId', selectedCarId);
    }
  }, [selectedCarId, form]);

  const { data: cars } = useQuery({
    queryKey: ["cars"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select("*");
      
      if (error) throw error;
      return data as Car[];
    },
  });

  const onSubmit = async (values: ReservationFormValues) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create a new date object for start time
      const startDateTime = new Date(values.date);
      if (!values.startTime) throw new Error("Start time is required");
      const [startHours, startMinutes] = values.startTime.split(":");
      startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);

      // Create a new date object for end time
      const endDateTime = new Date(values.date);
      if (!values.endTime) throw new Error("End time is required");
      const [endHours, endMinutes] = values.endTime.split(":");
      endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

      // Validate that end time is after start time
      if (endDateTime <= startDateTime) {
        throw new Error("End time must be after start time");
      }

      const { error } = await supabase
        .from("reservations")
        .insert({
          car_id: values.carId,
          user_id: user.id,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          purpose: values.purpose,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reservation created successfully",
      });
      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
    if (!newOpen) {
      form.reset();
    }
  };

  return (
    <Dialog open={isOpen ?? open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          New Reservation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Reservation</DialogTitle>
          <DialogDescription>
            Create a new car reservation by filling out the form below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="carId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Car</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a car" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cars?.map((car) => (
                        <SelectItem key={car.id} value={car.id}>
                          {car.make} {car.model} ({car.plate_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    className="rounded-md border"
                    disabled={(date) => date < new Date()}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter the purpose of reservation" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Create Reservation
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
