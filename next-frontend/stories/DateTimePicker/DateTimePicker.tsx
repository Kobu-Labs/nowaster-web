import { Calendar as CalendarIcon } from 'lucide-react';
import { DateTime } from "luxon"
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { SelectSingleEventHandler } from 'react-day-picker';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface DateTimePickerProps {
  onDateSelected: (date: Date | null) => void;
}

export function DateTimePicker({ onDateSelected }: DateTimePickerProps) {
  const [selectedDateTime, setSelectedDateTime] = useState<DateTime | null>(null);

  const handleSelect: SelectSingleEventHandler = (_day, selected) => {
    const selectedDate = DateTime.fromJSDate(selected);
    const modifiedDate = selectedDate.set({
      hour: selectedDateTime?.hour,
      minute: selectedDateTime?.minute,
    });

    if (modifiedDate.toJSDate().getTime() === selectedDateTime?.toJSDate().getTime()) {
      setSelectedDateTime(null)
      onDateSelected(null)
    } else {
      setSelectedDateTime(modifiedDate);
      onDateSelected(modifiedDate.toJSDate());
    }
  };

  const handleTimeChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const { value } = e.target;
    const hours = Number.parseInt(value.split(':')[0] || '00', 10);
    const minutes = Number.parseInt(value.split(':')[1] || '00', 10);

    let modifiedDay;
    if (selectedDateTime === null) {
      modifiedDay = DateTime.now().set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
    } else {
      modifiedDay = selectedDateTime.set({ hour: hours, minute: minutes });
    }

    setSelectedDateTime(modifiedDay);
    onDateSelected(modifiedDay.toJSDate());
  };

  return (
    <Popover>
      <PopoverTrigger asChild className="z-10">
        <Button
          variant={'outline'}
          className={cn(
            'w-[280px] justify-start text-left font-normal',
            !selectedDateTime && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDateTime ? (
            selectedDateTime.toFormat('DDD HH:mm')
          ) : (
            <span>Pick a date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDateTime?.toJSDate()}
          onSelect={handleSelect}
          initialFocus
        />
        <div className="px-4 pb-4 pt-0">
          <Label>Time</Label>
          <Input
            type="time"
            onChange={handleTimeChange}
            value={selectedDateTime?.toFormat('HH:mm')}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
