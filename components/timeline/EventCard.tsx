import { Event } from '@/lib/types';
import { formatDate } from '@/lib/utils/dateFormat';

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      {event.image_url && (
        <img
          src={event.image_url}
          alt={event.title}
          className="w-full h-48 object-cover rounded-lg mb-4"
        />
      )}

      <div className="text-sm text-gray-500 mb-2">
        {formatDate(event.date)}
        {event.end_date && ` - ${formatDate(event.end_date)}`}
      </div>

      <h3 className="text-xl font-bold mb-2">{event.title}</h3>

      {event.description && (
        <p className="text-gray-700 mb-4">{event.description}</p>
      )}

      {event.location_name && (
        <div className="text-sm text-gray-600 mb-2">📍 {event.location_name}</div>
      )}

      {event.links && event.links.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {event.links.map((link, i) => (
            <a
              key={i}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              Link {i + 1}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}


