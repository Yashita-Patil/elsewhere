import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/Dialog";
import Button from "./ui/Button";
import Input from "./ui/Input";
import { api } from "../api";
import { useCurrency } from "../context/CurrencyContext";
import { today } from "../utils/format";
import { travelerOptions } from "../utils/constants";

// The "Enquire about this trip" popup. Used on the home page and on the destination/package page.
// item = the package being booked (null = popup closed)
export default function BookingDialog({
  item,
  onClose,
  onBooked,
  defaultDate = "",
  defaultTravelers = 2,
  showPreview = false,
}) {
  const { formatPrice } = useCurrency();
  const [date, setDate] = useState(defaultDate);
  const [travelers, setTravelers] = useState(defaultTravelers);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // every time a new package is opened, reset the form
  useEffect(() => {
    if (item) {
      setDate(defaultDate);
      setTravelers(defaultTravelers);
      setError("");
    }
  }, [item]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!item || !date) return;
    setSaving(true);
    setError("");
    try {
      const booking = await api.post("/bookings", {
        packageId: item._id,
        travelDate: date,
        travelers,
      });
      onBooked(booking);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={showPreview ? "travel-dialog booking-dialog" : "travel-dialog"}>
        <DialogHeader>
          <p className="eyebrow">
            <span className="eyebrow-line" />
            Your next chapter
          </p>
          <DialogTitle>{item?.title ?? "Your journey"}</DialogTitle>
          <DialogDescription>
            {item?.location} · from {item ? formatPrice(item.price) : ""} per person
          </DialogDescription>
        </DialogHeader>

        {item && (
          <>
            {showPreview && (
              <>
                <img
                  className="booking-thumb"
                  src={item.image}
                  alt={item.location}
                  width={1280}
                  height={960}
                />
                <p className="booking-description">{item.description}</p>
              </>
            )}
            <form className="dialog-form" onSubmit={handleSubmit}>
              <label>
                When shall we start?
                <Input
                  type="date"
                  required
                  value={date}
                  min={today()}
                  onChange={(event) => setDate(event.target.value)}
                />
              </label>
              <label>
                Who’s coming?
                <select
                  value={travelers}
                  onChange={(event) => setTravelers(Number(event.target.value))}
                >
                  {travelerOptions.map((count) => (
                    <option key={count} value={count}>
                      {count} {count === 1 ? "traveler" : "travelers"}
                    </option>
                  ))}
                </select>
              </label>
              <p className="price-summary">
                Estimated total <strong>{formatPrice(item.price * travelers)}</strong>
              </p>
              <p className="fine-print">This saves your enquiry only. No payment is taken.</p>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" className="dialog-submit" disabled={saving}>
                {saving ? "Saving…" : "Save my enquiry"} <ArrowRight aria-hidden="true" />
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
