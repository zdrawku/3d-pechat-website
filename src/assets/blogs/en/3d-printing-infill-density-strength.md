# 3D Printing Infill: Density, Strength and Filament Use

**Reading time: 8 min**

Most people judge a 3D print by how it looks on the outside. What happens inside matters just as much: the infill structure decides how strong, how heavy and how efficient each 3D printed part is. If you want to get more out of your prints, understanding infill is the place to start.

In this article we look at what infill is in 3D printing, how infill density affects the result, which infill patterns work best, and how to balance strength against filament use.

## What is infill in 3D printing?

Infill is the structure that fills the inside of a 3D printed object. Printing every part fully solid would be expensive, slow and usually unnecessary. Instead, the printer builds an internal lattice that gives the part strength while using as little material as possible. The term comes from FDM printing, where parts are built from melted filament.

Think of a sandwich panel or a honeycomb: infill works on the same principle. The outer walls (perimeters) give a smooth surface, while the internal lattice holds the shape and adds strength.

### Why infill matters

The right infill settings can make the difference between a part that breaks the first time you use it and one that lasts for years. Infill affects:

- **Strength and durability** of the print
- **Weight** of the finished part
- **Print time** and throughput
- **Filament use** and cost
- **Flexibility** or stiffness of the part

## Infill density: how to choose the right percentage

Infill density is measured as a percentage, from 0% (hollow) to 100% (fully solid). Every common slicer lets you set this value to suit the part.

### General infill density guidelines

| Infill density | Typical use | Characteristics |
|----------------|------------|----------------|
| 0-10% | Decorative models, prototypes | Very fast, minimal filament, fragile |
| 10-20% | Standard models, display pieces | A good balance for non-critical uses |
| 20-40% | Functional parts, general use | The best choice for most projects |
| 40-60% | Load-bearing parts, tools | Stronger, but slower to print |
| 60-80% | Heavily loaded parts | Very strong, uses a lot of filament |
| 80-100% | Critical parts, mechanical components | Maximum strength, slow and expensive |

> **Important:** Raising infill from 20% to 100% often adds only 20-30% more strength, but doubles the print time and filament use. Finding the right balance is what counts.

### How infill density affects strength

The relationship between density and strength isn't linear. Tests show that:

- At 20% infill you get about 60-70% of the strength of a 100% solid part
- At 50% infill you reach 85-90% of the maximum strength
- Above 60-70% density, the extra strength is minimal

For most functional parts, 25-35% infill is the sweet spot that balances strength, weight and material use.

## Types of infill patterns

Each infill pattern behaves differently in terms of strength, print speed and the jobs it suits. Here are the most popular ones:

![3D printer printing a flat plate with honeycomb infill](assets/blogs/images/articles/honeycomb-infill-print.webp)

### Grid / rectilinear

The simplest and fastest pattern: lines that run back and forth, alternating direction between layers.

**Pros:**
- Very fast to print
- Good vertical strength
- Low material use

**Cons:**
- Weaker in some directions
- Can show through thin walls

### Triangles

Builds triangular structures, which are very stable.

**Pros:**
- Excellent strength in all directions
- Good for mechanical parts

**Cons:**
- Slower than grid
- Uses more filament

### Honeycomb (hexagonal)

A hexagonal structure inspired by nature.

**Pros:**
- Exceptional strength-to-weight ratio
- Even strength in all directions
- Efficient use of material

**Cons:**
- Slower to print
- More complex toolpaths

### Gyroid

A mathematically generated pattern with an organic, wave-like structure.

**Pros:**
- Excellent strength at low density
- No crossing lines (faster)
- Ideal for parts under load

**Cons:**
- Not available in every slicer
- Can look odd

### Which infill pattern to use when

- **Decorative models:** Grid, Lines (fast and cheap)
- **Functional parts:** Honeycomb, Gyroid, Cubic
- **Flexible parts:** Cross, Concentric
- **Mechanical components:** Triangles, Grid, Gyroid

## How infill affects filament use

Infill settings have a dramatic effect on how much filament a print uses. Here's a practical example:

![Kitchen scale weighing 3D printed parts, a simple way to track filament use](assets/blogs/images/articles/printed-parts-on-scale.webp)

For a typical functional part measuring 100 × 100 × 50 mm:

- **10% infill:** ~50 g of filament, 4 hours of printing
- **25% infill:** ~70 g of filament, 5.5 hours of printing
- **50% infill:** ~110 g of filament, 8 hours of printing
- **100% infill:** ~180 g of filament, 14 hours of printing

Optimising infill clearly saves a lot of filament and time, especially in larger production runs or when you work with more expensive 3D printing materials.

### Tips for saving filament

1. **Use variable infill**: lower in the centre, higher near the walls
2. **Add perimeters instead of infill**: this often gives better strength
3. **Choose an efficient pattern** such as Gyroid or Honeycomb
4. **Optimise wall thickness**: thicker walls often make up for low infill
5. **Use adaptive infill**: modern slicers can vary the density automatically

> **Ordering a print instead of printing it yourself?** Infill density directly sets how much the part weighs, and we price by weight. See our [prices](/en/prices/). If you're not sure what infill your part needs, [send us the model](/en/contact/) and we'll suggest settings and a material along with the quote.

## Special cases and techniques

### Adaptive and gradient infill

Modern slicers such as Cura, PrusaSlicer and Simplify3D offer smart infill features:

**Adaptive infill** automatically increases the density in areas that need more support (under sloped surfaces, around holes and so on).

**Gradient infill** gradually lowers the density from the outer walls towards the centre, giving maximum strength where it's needed with minimal material.

### Infill for different filaments

Different materials respond differently to infill settings:

**PLA:**
- Works very well with lower infill (15-25%)
- Good layer adhesion
- Standard patterns work perfectly

**ABS:**
- Needs slightly higher infill (25-35%)
- Watch out for warping in dense sections
- Prefer patterns that don't concentrate material in one spot

**PETG:**
- Excellent strength at low infill (20-30%)
- Very good layer bonding
- Honeycomb and Gyroid work extremely well

**TPU (flexible):**
- Very low infill (0-10%) for maximum flexibility
- Use Concentric or Cross patterns
- Avoid complex patterns

For more on choosing a material, see [the differences between PLA, PLA+, PLA Pro and PLN](/en/blog/pla-vs-pla-plus-vs-pla-pro-vs-pln/). And if you want light to pass through the part, use 100% infill.

## Testing and optimisation

To find the ideal infill settings for your project, follow these steps:

### How to test

1. **Print test cubes** at different infill settings (10%, 25%, 40%, 60%)
2. **Test their strength**: try to break them and squeeze them
3. **Compare the weight**: weigh each cube
4. **Record time and material**: note the figures from your slicer
5. **Pick the best one**: the lowest density that meets your requirements

### Strength versus material: a quick calculation

Use this formula for a quick estimate:

**Efficiency = (Strength / Weight) × 100**

A higher value means a more efficient setting. For functional parts, 25-35% infill usually gives the best efficiency.

## Common infill mistakes

### Too much infill

Many beginners use 80-100% infill, thinking "more is better". In reality, very dense infill:

- Causes warping from shrinkage
- Makes the print take 3-4 times longer
- Uses a huge amount of filament
- Increases internal stress in the part

### Too few perimeters

Low infill combined with few perimeters (walls) gives weak parts. You're better off with:

- 3-4 perimeters and 20% infill
- than 2 perimeters and 50% infill

Thick walls often matter more than dense infill.

### Ignoring print orientation

Parts are weakest between the layers, where the layer lines can split apart. Orient the model so the main load runs along the layers instead of pulling them apart, and increase infill in the critical areas.

## Practical examples

### Decorative vase

- **Infill:** 0-5%
- **Pattern:** Lines or Grid
- **Perimeters:** 2-3
- **Why:** It only needs to hold its shape, not take a load

Lithophanes are the opposite case: they're printed fully solid (100%), and the amount of light that comes through is set by the wall thickness. See [how to make a lithophane from a photo](/en/blog/3d-printed-lithophane-from-photo/).

### Toolbox

- **Infill:** 20-30%
- **Pattern:** Honeycomb or Grid
- **Perimeters:** 3-4
- **Why:** Moderate load, needs to be durable

### Car spare part

- **Infill:** 40-60%
- **Pattern:** Gyroid or Triangles
- **Perimeters:** 4-5
- **Why:** High load, critical use

### Flexible strap

- **Infill:** 5-15%
- **Pattern:** Concentric
- **Perimeters:** 2-3
- **Why:** Needs flexibility, not strength

## Slicer infill settings

The most popular slicers offer a wide range of infill options:

**Cura:**
- Infill Density
- Infill Pattern
- Gradual Infill Steps (gradient infill)
- Infill Line Directions

**PrusaSlicer:**
- Fill Density
- Fill Pattern
- Combine Infill (prints infill only every few layers)
- Infill/Perimeters Overlap

**Simplify3D:**
- Internal Fill Percentage
- Internal Fill Pattern
- Infill Extrusion Width
- Infill Layer Interval

Experiment with different combinations to find the right balance for your 3D printer and the job at hand.

## Conclusion

Infill settings are probably the most powerful tool you have for optimising 3D prints. The right density and pattern can greatly improve strength, cut filament costs and speed up production.

Remember the key principles:

- **20-35% infill is the best choice** for most functional parts
- **The pattern** matters as much as the density
- **Thick walls** are often more effective than high infill
- **Test and optimise** for your specific needs
- **Different materials** need different approaches

Whether you print prototypes, functional parts or decorative pieces, understanding infill will help you make better, stronger and more economical 3D prints.

Need a part printed with the right infill for the job? **[Get in touch](/en/contact/)** with your model or idea and we'll suggest the settings and material along with the free quote. You can also check our [prices](/en/prices/), browse our [ready-made products](/en/products/) or see [finished projects in our portfolio](/en/portfolio/).
