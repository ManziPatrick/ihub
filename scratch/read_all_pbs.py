import os

search_dir = '/Users/andela/.gemini'
found = False

for root, dirs, files in os.walk(search_dir):
  for file in files:
    full_path = os.path.join(root, file)
    try:
      # Skip very large files or binary directories if needed, but let's check everything under 10MB
      if os.path.getsize(full_path) < 10 * 1024 * 1024:
        with open(full_path, 'rb') as f:
          content = f.read()
          if b'Complete Public Speaking Mastery' in content:
            print(f"FOUND IN: {full_path}")
            idx = content.find(b'Complete Public Speaking Mastery')
            # Print the JSON block
            excerpt = content[max(0, idx-100):idx+4000]
            print(excerpt.decode('utf-8', errors='ignore'))
            found = True
    except Exception as e:
      pass

if not found:
  print("No match found anywhere in .gemini")
