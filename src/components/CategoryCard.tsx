import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import dogNeon from "@/assets/dog-neon.jpg";
import catNeon from "@/assets/cat-neon.jpg";
import birdNeon from "@/assets/bird-neon.jpg";
import chickenNeon from "@/assets/chicken-neon.jpg";
import turtleNeon from "@/assets/turtle-neon.jpg";
import fishNeon from "@/assets/fish-neon.jpg";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
}

const categoryImages: Record<string, string> = {
  perros: dogNeon,
  gatos: catNeon,
  pajaros: birdNeon,
  pollos: chickenNeon,
  tortugas: turtleNeon,
  peces: fishNeon,
};

interface CategoryCardProps {
  category: Category;
}

const CategoryCard = ({ category }: CategoryCardProps) => {
  const navigate = useNavigate();
  const imageUrl = categoryImages[category.slug] || dogNeon;

  return (
    <Card
      className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] cursor-pointer neon-border hover-glow bg-card/80 backdrop-blur overflow-hidden transition-all duration-300"
      onClick={() => navigate(`/category/${category.slug}`)}
    >
      <CardContent className="p-0">
        <div className="relative aspect-video overflow-hidden">
          <img
            src={imageUrl}
            alt={category.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
        <div className="p-6 text-center">
          <h3 className="text-2xl font-bold mb-2 neon-text">{category.name}</h3>
          {category.description && (
            <p className="text-muted-foreground">{category.description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryCard;
