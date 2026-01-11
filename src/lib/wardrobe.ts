export type WardrobeItem = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
};

export const sampleWardrobeItems: WardrobeItem[] = [
  {
    id: "1",
    title: "Cropped Linen Shirt",
    description: "Lightweight staple for warm days and quick layering.",
    imageUrl:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "2",
    title: "Wide-Leg Denim",
    description: "High-rise comfort with a relaxed silhouette.",
    imageUrl:
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "3",
    title: "Leather Crossbody",
    description: "Soft pebble grain with room for essentials.",
    imageUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800&auto=format&fit=crop",
  },
];
