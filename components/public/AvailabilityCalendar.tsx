'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Event as BigCalendarEvent } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, startOfDay, endOfDay, endOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { Spinner, Alert } from 'react-bootstrap';

const locales = { 'es': es };
const localizer = dateFnsLocalizer({ 
  format, 
  parse, 
  startOfWeek: () => startOfWeek(new Date(), { locale: es }), 
  getDay, 
  locales 
});

interface CalendarEvent extends BigCalendarEvent {
  id: string;
  backgroundColor?: string;
}

interface AvailabilityCalendarProps {
  resourceId: string;
  resourceType: 'space' | 'equipment';
}

export default function AvailabilityCalendar({ resourceId, resourceType }: AvailabilityCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState('week');
  const [date, setDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onNavigate = useCallback((newDate: Date) => setDate(newDate), []);
  const onView = useCallback((newView: any) => setView(newView), []);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    // Para simplificar, pedimos un rango amplio de una vez (ej. el mes actual +- 1 mes)
    const viewStart = startOfMonth(addDays(date, -30));
    const viewEnd = endOfMonth(addDays(date, 30));

    try {
      const response = await fetch(
        `/api/public/availability?resourceId=${resourceId}&resourceType=${resourceType}&start=${viewStart.toISOString()}&end=${viewEnd.toISOString()}`
      );

      if (!response.ok) {
        throw new Error('Error al cargar disponibilidad');
      }

      const rawEvents = await response.json();
      
      const formattedEvents: CalendarEvent[] = rawEvents.map((ev: any) => {
        // Handle recurring events vs single events
        if (ev.daysOfWeek) {
          // react-big-calendar doesn't support recurrence natively like FullCalendar
          // So we manually expand them for the next few months
          const expanded: CalendarEvent[] = [];
          let current = new Date(ev.startRecur || viewStart);
          const endLimit = new Date(ev.endRecur || viewEnd);
          
          while (current <= endLimit) {
            if (ev.daysOfWeek.includes(current.getDay())) {
              const [startH, startM] = ev.startTime.split(':');
              const [endH, endM] = ev.endTime.split(':');
              
              const start = new Date(current.getFullYear(), current.getMonth(), current.getDate(), parseInt(startH), parseInt(startM));
              const end = new Date(current.getFullYear(), current.getMonth(), current.getDate(), parseInt(endH), parseInt(endM));
              
              expanded.push({
                id: `${ev.id}-${current.toISOString()}`,
                title: ev.title,
                start,
                end,
                backgroundColor: ev.backgroundColor,
              });
            }
            current = addDays(current, 1);
          }
          return expanded;
        } else {
          return {
            id: ev.id,
            title: ev.title,
            start: new Date(ev.start),
            end: new Date(ev.end),
            backgroundColor: ev.backgroundColor,
          } as CalendarEvent;
        }
      }).flat();

      setEvents(formattedEvents);
    } catch (err: any) {
      console.error("Availability fetch error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [resourceId, resourceType, date]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const eventStyleGetter = (event: CalendarEvent) => {
    return { 
      style: { 
        backgroundColor: '#95a5a6', // Uniform Grey for all public events
        opacity: isLoading ? 0.7 : 1,
        fontSize: '0.8rem',
        border: 'none',
        color: '#fff'
      } 
    };
  };

  const { messages } = useMemo(() => ({
    messages: {
      next: "Sig.", 
      previous: "Ant.", 
      today: "Hoy", 
      month: "Mes", 
      week: "Semana", 
      day: "Día", 
      agenda: "Agenda", 
      date: "Fecha", 
      time: "Hora", 
      event: "Estado", 
      noEventsInRange: "Disponible todo el día.", 
      showMore: (total: number) => `+${total}`
    }
  }), []);

  return (
    <div className="availability-calendar-container" style={{ minHeight: '400px' }}>
      {error && <Alert variant="danger">{error}</Alert>}
      {isLoading && (
        <div className="text-center mb-2">
            <Spinner size="sm" animation="border" variant="primary" />
            <small className="ms-2">Sincronizando disponibilidad...</small>
        </div>
      )}
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '500px' }}
        culture="es"
        messages={messages}
        onNavigate={onNavigate}
        onView={onView}
        view={view as any}
        date={date}
        eventPropGetter={eventStyleGetter}
        min={new Date(0, 0, 0, 7, 0, 0)}
        max={new Date(0, 0, 0, 22, 0, 0)}
        tooltipAccessor={() => "Franja Horaria Ocupada"}
      />
      <div className="mt-3 d-flex gap-3 justify-content-center">
        <div className="d-flex align-items-center">
          <div style={{width: 15, height: 15, backgroundColor: '#95a5a6', marginRight: 5}}></div> 
          <small>Ocupado / No disponible</small>
        </div>
      </div>
    </div>
  );
}
