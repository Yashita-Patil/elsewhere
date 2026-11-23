import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/Dialog";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { api } from "../../api";
import { imageOptions, packageCategories } from "../../utils/constants";

const emptyForm = {
  title: "", location: "", destination: "", duration: 7, price: 1000, rating: 4.5,
  category: "", image: "/images/amalfi-coast.jpg", description: "",
};

// Add / edit popup for a journey (package). item = package to edit, or null to add a new one.
export default function PackageForm({ open, item, destinations, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(item ?? { ...emptyForm, destination: destinations[0]?._id ?? "" });
  }, [open, item, destinations]);

  const change = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      title: form.title, location: form.location, destination: form.destination,
      category: form.category, image: form.image, description: form.description,
      duration: Number(form.duration), price: Number(form.price), rating: Number(form.rating),
    };
    try {
      if (item) await api.put(`/packages/${item._id}`, payload);
      else await api.post("/packages", payload);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="travel-dialog">
        <DialogHeader>
          <DialogTitle>{item ? "Edit journey" : "Add journey"}</DialogTitle>
          <DialogDescription>Journeys are the bookable trips shown on the home page.</DialogDescription>
        </DialogHeader>
        <form className="dialog-form" onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <label className="is-wide">Title<Input required value={form.title} onChange={change("title")} /></label>
            <label>Location text (e.g. Bali, Indonesia)<Input required value={form.location} onChange={change("location")} /></label>
            <label>Destination
              <select required value={form.destination} onChange={change("destination")}>
                {destinations.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </label>
            <label>Category<Input required list="pkg-categories" value={form.category} onChange={change("category")} />
              <datalist id="pkg-categories">{packageCategories.slice(1).map((c) => <option key={c} value={c} />)}</datalist>
            </label>
            <label>Image<Input required list="pkg-images" value={form.image} onChange={change("image")} />
              <datalist id="pkg-images">{imageOptions.map((path) => <option key={path} value={path} />)}</datalist>
            </label>
            <label>Duration (days)<Input required type="number" min="1" value={form.duration} onChange={change("duration")} /></label>
            <label>Price per person (USD)<Input required type="number" min="0" value={form.price} onChange={change("price")} /></label>
            <label>Rating (0 to 5)<Input required type="number" min="0" max="5" step="0.01" value={form.rating} onChange={change("rating")} /></label>
            <label className="is-wide">Description<textarea required value={form.description} onChange={change("description")} /></label>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <Button type="submit" className="dialog-submit" disabled={saving}>{saving ? "Saving…" : "Save journey"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
