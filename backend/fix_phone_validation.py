#!/usr/bin/env python3
"""Fix phone validation: remove from wrong location, place in correct createCourse location."""

filepath = "backend/src/graphql/resolvers.ts"

with open(filepath, "r") as f:
    lines = f.readlines()

# Find the wrongly-placed phone validation block (around line 2352)
# It starts at line 2352 (0-indexed: 2351) and ends about 9 lines later
wrong_start = None
wrong_end = None

for i, line in enumerate(lines):
    if "Phone validation: if publishing" in line and i < 4000:
        wrong_start = i
        # Find the closing of this block: the "}" for the if statement
        # The block is:
        # Line 0: // Phone validation comment
        # Line 1: if (...){ 
        # Line 2:   const instructorIdToCheck...
        # Line 3:   const instructor = await...
        # Line 4:   if (!instructor...){
        # Line 5:     throw new Error(...)
        # Line 6:   }
        # Line 7: }
        # Line 8: (empty line)
        # Total: 9 lines
        wrong_end = i + 9
        break

print(f"Wrong insertion at lines {wrong_start+1} to {wrong_end}")

# Remove the wrong insertion
if wrong_start is not None and wrong_end is not None:
    lines = lines[:wrong_start] + lines[wrong_end:]

# Now find createCourse and add the validation in the right place
create_course_start = None
for i, line in enumerate(lines):
    if "createCourse: async" in line:
        create_course_start = i
        break

print(f"createCourse starts at line {create_course_start+1}")

# Find the end of the auth check in createCourse
# Looking for: "      }" after "throw new Error('Not authorized');"
# Then empty line, then "      const course = new Course({"
auth_check_end = None
for i in range(create_course_start, min(create_course_start + 20, len(lines))):
    line = lines[i]
    # We're looking for the closing brace of the role check if-block
    # Pattern: after "throw new Error('Not authorized');" there's a "      }"
    if "throw new Error('Not authorized')" in line:
        auth_check_end = i + 1  # The next line is "      }"
        break

print(f"Auth check ends at line {auth_check_end+1}")

if auth_check_end is not None:
    create_validation = [
        "\n",
        "      // Phone validation: if publishing, instructor must have a valid phone number for commission payouts\n",
        "      if ((args.status || 'published') === 'published') {\n",
        "        const instructorIdToCheck = instructorId || context.user.id;\n",
        "        const instructor = await User.findById(instructorIdToCheck).select('phone').lean();\n",
        "        if (!instructor || !instructor.phone || instructor.phone.trim() === '') {\n",
        "          throw new Error('Cannot publish course: Instructor must have a valid phone number registered for commission payouts. Please set a phone number in your profile first.');\n",
        "        }\n",
        "      }\n",
    ]
    
    lines = lines[:auth_check_end+1] + create_validation + lines[auth_check_end+1:]

with open(filepath, "w") as f:
    f.writelines(lines)

print("✅ Fixed! Wrong validation removed, correct validation added to createCourse.")

# Verify
for i, line in enumerate(lines):
    if "Phone validation" in line:
        if "updateCourse" in ''.join(lines[max(0,i-15):i+15]):
            context = "updateCourse"
        elif "createCourse" in ''.join(lines[max(0,i-15):i+15]):
            context = "createCourse"
        else:
            context = "UNKNOWN - wrong place!"
        print(f"  Line {i+1}: Phone validation in {context}")
