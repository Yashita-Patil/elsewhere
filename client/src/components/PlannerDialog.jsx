import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/Dialog";
import Button from "./ui/Button";
import Input from "./ui/Input";
import { today } from "../utils/format";
import { travelerOptions } from "../utils/constants";

const styles = ["Slow & soulful", "Adventure", "Food & culture", "Wildlife", "A bit of everything"];
const budgets = ["Under $2,000", "$2,000 – $3,500", "$3,500 – $5,000", "$5,000+"];

// "Plan your trip" popup. On submit it hands the answers back to the Home page, which filters the results.
export default function PlannerDialog({ open, onOpenChange, destinations, notice, onSubmit }) {
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [travelers, setTravelers] = useState(2);
  const [style, setStyle] = useState("Slow & soulful");
  const [budget, setBudget] = useState("$2,000 – $3,500");

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ destination, date, travelers, style, budget });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="travel-dialog planner-dialog">
        <DialogHeader>
          <p className="eyebrow"><span className="eyebrow-line" />A little daydreaming</p>
          <DialogTitle>Let’s plan <em>your elsewhere.</em></DialogTitle>
          <DialogDescription>Tell us what you’re dreaming about and we’ll find a place to begin.</DialogDescription>
        </DialogHeader>
        <form className="dialog-form" onSubmit={handleSubmit}>
          <label>Where are you dreaming of?
            <select required value={destination} onChange={(event) => setDestination(event.target.value)}>
              <option value="">Choose a place</option>
              {destinations.map((item) => (
                <option key={item.slug} value={item.name}>{item.name}, {item.country}</option>
              ))}
            </select>
          </label>
          <label>When would you like to go?
            <Input type="date" required value={date} onChange={(event) => setDate(event.target.value)} min={today()} />
          </label>
          <div className="dialog-split">
            <label>Travelers
              <select value={travelers} onChange={(event) => setTravelers(Number(event.target.value))}>
                {travelerOptions.map((count) => (
                  <option key={count} value={count}>{count} {count === 1 ? "traveler" : "travelers"}</option>
                ))}
              </select>
            </label>
            <label>Your kind of trip
              <select value={style} onChange={(event) => setStyle(event.target.value)}>
                {styles.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>
          <label>Comfortable budget, per person
            <select value={budget} onChange={(event) => setBudget(event.target.value)}>
              {budgets.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          {notice && <p className="form-notice" role="status">{notice}</p>}
          <Button type="submit" className="dialog-submit">Show me the possibilities <ArrowRight aria-hidden="true" /></Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
