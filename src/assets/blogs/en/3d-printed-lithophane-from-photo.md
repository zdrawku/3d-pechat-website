# 3D Printed Lithophanes: Turn a Photo into a Glowing Model

**Reading time: 8 min**

A lithophane is one of the most striking things you can make with a 3D printer at home. It turns a favourite photo, a memory or a piece of art into a thin 3D model that reveals the picture when you place it in front of a light. In this article we look at what a lithophane is, how it works and how you can make an impressive glowing model yourself on a 3D printer.

## What is a lithophane?

A lithophane is a thin panel of varying thickness that reveals an image when it's lit from behind. The technique dates back to the 19th century, when lithophanes were made from porcelain. Today, thanks to 3D printing, anyone can make a personalised lithophane at home.

> "A lithophane is a magical blend of photography, sculpture and light: a memory that literally glows."

The principle is simple. Thicker areas let less light through and look darker, while thinner areas let more light through and look brighter. This creates a gradient of light and dark tones that reproduces the original photo.

## Why 3D printing is ideal for lithophanes

3D printers have several key advantages for making lithophanes:

- **Precision:** modern 3D printers can reproduce very fine detail and smooth transitions in thickness
- **Accessibility:** you don't need special moulds or expensive equipment
- **Personalisation:** you can turn any photo into a one-of-a-kind gift
- **Speed:** unlike traditional methods, a 3D print takes hours, not days
- **Repeatability:** once you have the digital model, you can print it as many times as you like

## What you need

### Hardware

To make a good lithophane you'll need:

- **A 3D printer:** FDM printers are the best fit for this
- **A well-calibrated print bed:** critical for an even thickness
- **An LED or another light source:** to light the finished model
- **A stand or frame:** to display the lithophane (optional)

### Best material for lithophanes

| Material | Pros | Cons | Verdict |
|----------|------|------|---------|
| [PLA](/en/blog/pla-vs-pla-plus-vs-pla-pro-vs-pln/) | Easy to print, affordable, good translucency | More brittle in thin sections | ⭐⭐⭐⭐⭐ Excellent choice |
| PETG | Stronger, better translucency | Harder to print | ⭐⭐⭐⭐ Very good |
| ABS | Durable, heat-resistant | Poor translucency, fumes | ⭐⭐ Not recommended |
| Resin (SLA printers) | Exceptional detail | Expensive, needs post-processing | ⭐⭐⭐⭐ Specialist |

**Our pick is white PLA.** It gives the best balance of quality, price and ease of printing.

## Step by step: how to make a lithophane

### Step 1: Choose and prepare the photo

The quality of the finished lithophane depends heavily on the photo you choose:

- Pick a photo with **good contrast** and clear detail
- Avoid oversaturated or very dark areas
- Portraits and landscapes with a clear subject work very well
- Resolution of at least **1000×1000 pixels**
- Format: JPG, PNG or BMP

**Tips for better results:**
- Raise the contrast slightly before converting
- Avoid photos with lots of fine detail in the background
- Black-and-white photos often give better results than colour ones

### Step 2: Convert the photo into a 3D model

There are several free tools that turn a photo into a lithophane model:

**ItsLitho (itslitho.com)**
- Free online converter
- Intuitive interface
- Preview before you download

**3DP Rocks Image Converter**
- More settings to control
- Different shapes (rectangular, round, heart)
- Exports straight to STL

**Cura's built-in image import**
- Works directly inside the slicer
- A more technical approach with full control

### Step 3: Conversion settings

When you convert the photo, pay attention to these parameters:

```
Recommended settings:
- Maximum thickness: 3-4 mm
- Minimum thickness: 0.8-1 mm
- Size: 100-150 mm (longer side)
- Shape: flat or curved (your preference)
- Positive/negative: positive (standard)
```

### Step 4: Lithophane print settings

The quality of a lithophane depends critically on getting the printer settings right:

**Key settings:**
- **Layer height**: 0.1–0.12 mm (the lower, the better)
- **Print speed**: 40–50 mm/s (slower for better quality)
- **Infill**: 100% (essential!)
- **Walls**: not a concern at 100% infill
- **Supports**: usually not needed
- **Nozzle temperature**: as recommended for the material
- **Bed temperature**: 50–60°C for PLA

**Print orientation:**
> Print the lithophane standing up (vertically), not lying flat. That way the thickness that forms the image is traced by the nozzle within each layer instead of being stacked up in whole-layer steps, and the effect is noticeably better.

### Step 5: Printing and post-processing

**During the print:**
- Watch the first layer closely
- Make sure there's no wobble or vibration
- Avoid temperature changes in the room

**After the print:**
- Remove the model carefully from the print bed
- Clean up any imperfections with fine sandpaper (400 grit or higher); see our [complete guide to smoothing PLA](/en/blog/how-to-smooth-pla-prints/)
- Wipe it with a soft cloth
- Don't paint the model: leave it white for the best effect

## How to display a lithophane

Once you've printed your lithophane, it's time to show it off at its best:

![A 3D printed owl lamp glowing in the dark, showing how light passes through thin printed walls](assets/blogs/images/articles/owl-lamp-lit.webp)

### LED frame

The most popular option is a dedicated frame with built-in LED lighting:
- Use LED strips or panels with neutral white light
- Make sure the light is even across the whole surface
- Distance between the light and the lithophane: 2–5 cm

### Window or daylight

Place the lithophane in front of a window for a natural effect during the day. It's the simplest option, but it only works in daylight.

### Night light

Many lithophanes are used as night lights, especially with children's themes or family photos.

## Common lithophane problems and how to fix them

### Uneven translucency

**Causes:**
- Uncalibrated print bed
- Inconsistent extrusion
- Poor first-layer adhesion

**Fix:** Recalibrate the printer and check the Z offset.

### Image too dark or too light

**Cause:** Wrong conversion settings

**Fix:** Widen the range between minimum and maximum thickness, or adjust the photo's contrast.

### Brittleness

**Cause:** Sections that are too thin, or poor-quality material

**Fix:** Raise the minimum thickness to at least 1 mm and use good-quality PLA.

### Visible layer lines

**Cause:** Layer height too large

**Fix:** Lower it to 0.1 mm or less.

## Lithophane ideas

3D printed lithophanes are perfect for:

- **Personalised gifts:** anniversaries, weddings, birthdays (and a popular product if you sell your own 3D prints)
- **Family memories:** portraits, holiday photos
- **Home decor:** one-of-a-kind interior pieces
- **Business gifts:** company logos, corporate photos
- **Art projects:** reproductions of paintings, abstract designs
- **Memorial keepsakes:** in memory of loved ones or pets

## Advanced techniques

### Multicolour lithophanes

Classic lithophanes are a single colour, but you can experiment with:
- Different filament colours in different layers
- Combining several lithophanes with colour filters
- RGB LED lighting for changing colour effects

### Round and cylindrical lithophanes

Instead of flat panels, you can make:
- Cylindrical lampshades
- Spherical lamps
- Conical designs for a more dynamic effect

### Lithophanes with text and graphics

Combine photos with text, logos or decorative elements for an even more personal result.

## Tips for advanced users

If you want to reach professional quality:

- **Experiment with thicknesses:** find the best range for your printer
- **Calibrate the flow:** too much or too little filament has a dramatic effect on quality
- **Control the environment:** keep a steady temperature and avoid draughts
- **Test with small versions:** before printing a large model, do a 50×50 mm test
- **Use good-quality filament:** cheap filament often has an inconsistent diameter
- **Clean the nozzle regularly:** residue affects print quality

## Printing at home vs a 3D printing service

| Aspect | Printing at home | 3D printing service |
|--------|------------------|----------------------|
| Cost per piece | Lower once you've made the initial investment | Higher for one-off pieces |
| Quality | Depends on your equipment and skills | Consistently high |
| Time | Includes time to learn and experiment | Quick turnaround |
| Flexibility | Full control and as many iterations as you like | Limited to what you order |
| Materials | Limited to what you have | PLA as standard; others (e.g. PETG) sourced for the order |

## Conclusion

Making a lithophane with a 3D printer is an accessible, creative and rewarding project that brings technology and art together. With the right settings and a little practice, you can turn favourite memories into one-of-a-kind glowing works of art. A lithophane makes an exceptional gift that always impresses and carries real emotional value.

Whether you're new to 3D printing or an experienced maker, lithophanes offer endless room for personalisation and creativity. Try different photos, sizes and shapes to find the style that best fits your vision.

If you don't have a 3D printer, or you'd like a professional result first time, **get in touch with us at 3dpechat.bg**. We'll help you turn your idea into a high-quality 3D print and give you practical advice along the way; the consultation is free. We make lithophanes with tuned settings and quality materials, and we can print small batches for special events. Send us your photo by email or Viber (details are on the [contact page](/en/contact/)), or get an estimate with the [price calculator](/en/prices/). Your own glowing keepsake is just one enquiry away!
