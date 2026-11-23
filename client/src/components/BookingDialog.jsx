import { useEffect, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
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
  const [step, setStep] = useState(1);
  const [createdBooking, setCreatedBooking] = useState(null);

  // every time a new package is opened, reset the form
  useEffect(() => {
    if (item) {
      setDate(defaultDate);
      setTravelers(defaultTravelers);
      setError("");
      setStep(1);
      setCreatedBooking(null);
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
      setCreatedBooking(booking);
      setStep(2);
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
          <DialogTitle>{step === 2 ? "Enquiry Confirmed" : (item?.title ?? "Your journey")}</DialogTitle>
          <DialogDescription>
            {item?.location} · from {item ? formatPrice(item.price) : ""} per person
          </DialogDescription>
        </DialogHeader>

        {/* Animated Booking Progress Indicator */}
        <div className="booking-progress-track" aria-label="Booking steps">
          <div className={`booking-step ${step >= 1 ? "is-active" : ""} ${step > 1 ? "is-done" : ""}`}>
            <span className="step-num">{step > 1 ? <Check className="w-3.5 h-3.5" /> : "1"}</span>
            <span className="step-name">Details</span>
          </div>
          <div className={`booking-progress-connector ${step >= 2 ? "is-filled" : ""}`} />
          <div className={`booking-step ${step >= 2 ? "is-active is-done" : ""}`}>
            <span className="step-num">2</span>
            <span className="step-name">Confirmed</span>
          </div>
        </div>

        {item && step === 1 && (
          <div className="booking-step-content step-fade-in">
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
          </div>
        )}

        {item && step === 2 && (
          <div className="booking-success-container step-fade-in">
            <div className="success-pulse-rings">
              <div className="pulse-ring ring-1" />
              <div className="pulse-ring ring-2" />
              <div className="success-icon-disc">
                <Check className="success-check-icon" />
              </div>
            </div>
            <h3 className="success-title">Your journey is noted.</h3>
            <p className="success-subtitle">
              We’ve reserved your provisional dates for <em>{item.location}</em> for {travelers}{" "}
              {travelers === 1 ? "traveler" : "travelers"}.
            </p>
            <div className="success-details-card">
              <div>
                <span>Selected departure</span>
                <strong>{date}</strong>
              </div>
              <div>
                <span>Estimated journey total</span>
                <strong>{formatPrice(item.price * travelers)}</strong>
              </div>
            </div>
            <Button
              type="button"
              className="dialog-submit success-action-btn"
              onClick={() => onBooked(createdBooking)}
            >
              View in My Trips <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
