# AAT3020-01 Project: Shape of My Words

## Goal

Create a game that visualizes the semantic relationships between a given word and user-input words as an n-gon shape in 2D PCA space.

The vertices represent the given word and the input words, with edges showing how semantically close or distant they are.

## How It Works

(Let’s say n = 3 in this proposal, triangle)

Input: One random word and two user-input words.
Output: A triangle where each vertex represents a word plotted in 2D space.

### Example

Given(Pivot): "king"

Inputs: "sleep", "bedtime", "castle"

"king", "sleep", and "bedtime" are plotted to form a triangle. The edges show how closely related the words are.

## Implementation

### Data Processing

Generate 600D embeddings using ConceptNet-Numberbatch.

Reduce to 2D using PCA for plotting.

Store the coordinates as {word: [x, y]}.

### Calculation

Calculate cosine similarity for every pair:

Given word - Input 1

Given word - Input 2

Input 1 - Input 2

### Visualization

Plot the words as points in 2D space.

Draw edges to form a triangle, with the given word as one vertex.

If the game expands, more input words will form polygons (e.g., quadrilateral for ).
