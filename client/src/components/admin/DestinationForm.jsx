import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/Dialog";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { api } from "../../api";
import { imageOptions } from "../../utils/constants";

const emptyForm = {
  name: "", slug: "", country: "", region: "", tagline: "", description: "",
  image: "/images/amalfi-coast.jpg", category: "", days: 7, from: 1000, highlights: "",
};

// Add / edit popup for a destination. item = destination to edit, or null to add a new one.
export default function DestinationForm({ open, item, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(item ? { ...item, highlights: item.highlights.join(", ") } : emptyForm);
  }, [open, item]);

  // one function updates any field: change("name")(event)
  const change = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      name: form.name, slug: form.slug, country: form.country, region: form.region,
      tagline: form.tagline, description: form.description, image: form.image, category: form.category,
      days: Number(form.days), from: Number(form.from),
      highlights: form.highlights.split(",").map((text) => text.trim()).filter(Boolean),
    };
    try {
      if (item) await api.put(`/destinations/${item._id}`, payload);
      else await api.post("/destinations", payload);
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
          <DialogTitle>{item ? "Edit destination" : "Add destination"}</DialogTitle>
          <DialogDescription>These details appear on the home page and the destination page.</DialogDescription>
        </DialogHeader>
        <form className="dialog-form" onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <label>Name<Input required value={form.name} onChange={change("name")} /></label>
            <label>URL slug (e.g. bali)<Input required value={form.slug} onChange={change("slug")} /></label>
            <label>Country<Input required value={form.country} onChange={change("country")} /></label>
            <label>Region<Input required value={form.region} onChange={change("region")} /></label>
            <label>Category<Input required list="dest-categories" value={form.category} onChange={change("category")} />
              <datalist id="dest-categories">{["Coast", "Island", "Mountain", "Wildlife", "Culture"].map((c) => <option key={c} value={c} />)}</datalist>
            </label>
            <label>Image<Input required list="image-options" value={form.image} onChange={change("image")} />
              <datalist id="image-options">{imageOptions.map((path) => <option key={path} value={path} />)}</datalist>
            </label>
            <label>Days<Input required type="number" min="1" value={form.days} onChange={change("days")} /></label>
            <label>Price from (USD)<Input required type="number" min="0" value={form.from} onChange={change("from")} /></label>
            <label className="is-wide">Tagline<Input required value={form.tagline} onChange={change("tagline")} /></label>
            <label className="is-wide">Description<textarea required value={form.description} onChange={change("description")} /></label>
            <label className="is-wide">Highlights (separate with commas)<Input value={form.highlights} onChange={change("highlights")} /></label>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <Button type="submit" className="dialog-submit" disabled={saving}>{saving ? "Saving…" : "Save destination"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
