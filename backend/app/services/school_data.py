# import json
# import os
# import re
# from typing import Any, Dict, List, Optional, Set
# from datetime import datetime
# from difflib import SequenceMatcher

# from app.core.config import settings

# # Month mappings for better parsing
# MONTHS = {
#     "january": 1, "jan": 1,
#     "february": 2, "feb": 2,
#     "march": 3, "mar": 3,
#     "april": 4, "apr": 4,
#     "may": 5,
#     "june": 6, "jun": 6,
#     "july": 7, "jul": 7,
#     "august": 8, "aug": 8,
#     "september": 9, "sept": 9, "sep": 9,
#     "october": 10, "oct": 10,
#     "november": 11, "nov": 11,
#     "december": 12, "dec": 12
# }

# MONTH_NAMES = [
#     "January", "February", "March", "April", "May", "June",
#     "July", "August", "September", "October", "November", "December"
# ]


# class SchoolDataStore:
#     """
#     Optimized school data store with improved natural language understanding
#     and flexible querying capabilities.
#     """

#     def __init__(self) -> None:
#         self.rows: List[Dict[str, Any]] = []
#         self.loaded: bool = False
#         # Create indexes for faster lookups
#         self.student_index: Dict[int, List[int]] = {}
#         self.school_index: Dict[str, List[int]] = {}
#         self.class_index: Dict[str, List[int]] = {}
#         self.month_index: Dict[str, List[int]] = {}

#     def load(self) -> None:
#         """Load and index the school data."""
#         if self.loaded:
#             return

#         path = settings.school_data_path
#         if not path:
#             self.rows = []
#             self.loaded = True
#             return

#         abs_path = path if os.path.isabs(path) else os.path.join(os.getcwd(), path)

#         try:
#             with open(abs_path, "r", encoding="utf-8") as f:
#                 raw = json.load(f)

#             # Support multiple JSON formats
#             if isinstance(raw, list):
#                 data = raw
#             elif isinstance(raw, dict) and isinstance(raw.get("data"), list):
#                 data = raw["data"]
#             else:
#                 data = []

#             # Clean and normalize data
#             self.rows = []
#             for idx, r in enumerate(data):
#                 if not isinstance(r, dict):
#                     continue
                
#                 cleaned_row = {
#                     "school_name": str(r.get("school_name", "")).strip(),
#                     "student_id": r.get("student_id", None),
#                     "student_name": str(r.get("student_name", "")).strip(),
#                     "class": str(r.get("class", "")).strip(),
#                     "fee_status": str(r.get("fee_status", "")).strip(),
#                     "month": str(r.get("month", "")).strip(),
#                 }
#                 self.rows.append(cleaned_row)
                
#                 # Build indexes
#                 self._index_row(idx, cleaned_row)

#             self.loaded = True

#         except Exception as e:
#             # Log error if needed
#             self.rows = []
#             self.loaded = True

#     def _index_row(self, idx: int, row: Dict[str, Any]) -> None:
#         """Create indexes for faster lookups."""
#         # Student ID index
#         if row.get("student_id") is not None:
#             sid = row["student_id"]
#             if sid not in self.student_index:
#                 self.student_index[sid] = []
#             self.student_index[sid].append(idx)

#         # School name index
#         school = self._normalize(row.get("school_name"))
#         if school:
#             if school not in self.school_index:
#                 self.school_index[school] = []
#             self.school_index[school].append(idx)

#         # Class index
#         cls = self._normalize(row.get("class"))
#         if cls:
#             if cls not in self.class_index:
#                 self.class_index[cls] = []
#             self.class_index[cls].append(idx)

#         # Month index (normalize to "Month Year" format)
#         month = self._normalize_month(row.get("month"))
#         if month:
#             if month not in self.month_index:
#                 self.month_index[month] = []
#             self.month_index[month].append(idx)

#     def _normalize(self, s: Optional[str]) -> str:
#         """Normalize strings for comparison."""
#         return (s or "").strip().lower()

#     def _normalize_month(self, month_str: Optional[str]) -> Optional[str]:
#         """Normalize month string to consistent format."""
#         if not month_str:
#             return None
        
#         month_str = month_str.strip()
#         # Try to extract month and year
#         match = re.search(r'(\w+)\s*(\d{4})?', month_str, re.I)
#         if match:
#             month_name = match.group(1).lower()
#             year = match.group(2)
            
#             # Find month number
#             if month_name in MONTHS:
#                 month_num = MONTHS[month_name]
#                 month_full = MONTH_NAMES[month_num - 1]
#                 if year:
#                     return f"{month_full} {year}"
#                 return month_full
        
#         return month_str.strip()

#     def _extract_student_id(self, q: str) -> Optional[int]:
#         """Extract student ID from query."""
#         patterns = [
#             r'\bstudent\s*(?:id|number|no\.?)\s*[:#]?\s*(\d+)\b',
#             r'\bid\s*[:#]?\s*(\d+)\b',
#             r'\bstudent\s+(\d+)\b',
#             r'\b(?:id|ID)\s*(\d+)\b'
#         ]
        
#         for pattern in patterns:
#             match = re.search(pattern, q, re.I)
#             if match:
#                 try:
#                     return int(match.group(1))
#                 except:
#                     pass
#         return None

#     def _extract_student_name(self, q: str) -> Optional[str]:
#         """Extract student name from query."""
#         # Look for patterns like "student named X", "X's fee", etc.
#         patterns = [
#             r'student\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)',  # "student Hassan Ali"
#             r'student\s+named\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
#             r'(?:of|for)\s+student\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)',
#             r'(?:of|for)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)',  # "of Hassan Ali" (requires full name)
#             r"([A-Z][a-z]+\s+[A-Z][a-z]+)[\']?s?\s+(?:fee|status)",  # "Hassan Ali's fee" (requires full name)
#         ]
        
#         for pattern in patterns:
#             match = re.search(pattern, q)
#             if match:
#                 return match.group(1).strip()
#         return None

#     def _extract_month(self, q: str) -> Optional[str]:
#         """Extract month from query with support for various formats."""
#         ql = q.lower()
        
#         # Check for relative months
#         if "last month" in ql or "previous month" in ql:
#             current = datetime.now()
#             month = current.month - 1 if current.month > 1 else 12
#             year = current.year if current.month > 1 else current.year - 1
#             return f"{MONTH_NAMES[month - 1]} {year}"
        
#         if "this month" in ql or "current month" in ql:
#             current = datetime.now()
#             return f"{MONTH_NAMES[current.month - 1]} {current.year}"
        
#         # Check for specific month mentions
#         for month_name, month_num in MONTHS.items():
#             pattern = rf'\b{month_name}\b'
#             if re.search(pattern, ql):
#                 # Check if year is mentioned
#                 year_match = re.search(rf'\b{month_name}\b\s*(\d{{4}})\b', ql, re.I)
#                 if year_match:
#                     return f"{MONTH_NAMES[month_num - 1]} {year_match.group(1)}"
#                 return MONTH_NAMES[month_num - 1]
        
#         return None

#     def _extract_school_name(self, q: str) -> Optional[str]:
#         """Extract school name from query."""
#         patterns = [
#             r'(?:from|at|in|of)\s+([A-Z][a-zA-Z\s]+School)',
#             r'([A-Z][a-zA-Z\s]+School)',
#             r'school\s+named\s+([A-Z][a-zA-Z\s]+)',
#         ]
        
#         for pattern in patterns:
#             match = re.search(pattern, q)
#             if match:
#                 return match.group(1).strip()
#         return None

#     def _extract_class(self, q: str) -> Optional[str]:
#         """Extract class from query."""
#         patterns = [
#             r'class\s+(\d+[a-zA-Z]?|\w+)',
#             r'grade\s+(\d+)',
#             r'in\s+(\d+[a-zA-Z]?)\s+class',
#         ]
        
#         for pattern in patterns:
#             match = re.search(pattern, q, re.I)
#             if match:
#                 return match.group(1).strip()
#         return None

#     def _extract_fee_status(self, q: str) -> Optional[str]:
#         """Extract fee status filter from query."""
#         ql = q.lower()
#         if any(word in ql for word in ["unpaid", "pending", "due", "outstanding"]):
#             return "unpaid"
#         if "paid" in ql:
#             return "paid"
#         return None

#     def _fuzzy_match(self, str1: str, str2: str, threshold: float = 0.8) -> bool:
#         """Check if two strings match with fuzzy matching."""
#         return SequenceMatcher(None, str1.lower(), str2.lower()).ratio() >= threshold

#     def _is_school_query(self, q: str) -> bool:
#         """Determine if query is related to school data."""
#         ql = q.lower()
#         school_keywords = [
#             "fee", "paid", "unpaid", "payment", "student", "class", "school",
#             "grade", "tuition", "month", "status", "outstanding", "due"
#         ]
#         return any(keyword in ql for keyword in school_keywords)

#     def _exact_name_match(self, name1: str, name2: str) -> bool:
#         """Check if two names match exactly (case-insensitive)."""
#         return self._normalize(name1) == self._normalize(name2)

#     def _filter_by_criteria(self, query: str) -> List[Dict[str, Any]]:
#         """Filter rows based on extracted criteria."""
#         candidates = list(range(len(self.rows)))
        
#         # Extract all criteria
#         student_id = self._extract_student_id(query)
#         student_name = self._extract_student_name(query)
#         month = self._extract_month(query)
#         school_name = self._extract_school_name(query)
#         class_name = self._extract_class(query)
#         fee_status = self._extract_fee_status(query)

#         # Filter by student ID (highest priority - exact match)
#         if student_id is not None:
#             candidates = self.student_index.get(student_id, [])
#             if not candidates:
#                 return []

#         # Filter by student name (EXACT match required, second highest priority)
#         if student_name:
#             name_matches = []
#             for idx in candidates:
#                 row_name = self.rows[idx].get("student_name", "")
#                 if self._exact_name_match(student_name, row_name):
#                     name_matches.append(idx)
#             # If exact matches found, use only those
#             if name_matches:
#                 candidates = name_matches
#             else:
#                 # No exact match found - return empty to avoid wrong matches
#                 return []

#         # Filter by school (only if name/ID already filtered or not specified)
#         if school_name and candidates:
#             school_matches = []
#             school_norm = self._normalize(school_name)
#             for idx in candidates:
#                 row_school = self._normalize(self.rows[idx].get("school_name"))
#                 if school_norm in row_school or row_school in school_norm or \
#                    self._fuzzy_match(school_name, self.rows[idx].get("school_name", ""), 0.7):
#                     school_matches.append(idx)
#             if school_matches:
#                 candidates = school_matches

#         # Filter by class
#         if class_name and candidates:
#             class_norm = self._normalize(class_name)
#             class_matches = []
#             for idx in candidates:
#                 row_class = self._normalize(self.rows[idx].get("class"))
#                 if class_norm == row_class or class_norm in row_class:
#                     class_matches.append(idx)
#             if class_matches:
#                 candidates = class_matches

#         # Filter by month
#         if month and candidates:
#             month_matches = []
#             month_norm = self._normalize(month)
#             for idx in candidates:
#                 row_month = self._normalize_month(self.rows[idx].get("month"))
#                 if row_month:
#                     row_month_norm = self._normalize(row_month)
#                     # Match either "March" or "March 2024"
#                     if month_norm in row_month_norm or row_month_norm.startswith(month_norm.split()[0]):
#                         month_matches.append(idx)
#             if month_matches:
#                 candidates = month_matches

#         # Filter by fee status
#         if fee_status and candidates:
#             status_matches = []
#             for idx in candidates:
#                 row_status = self._normalize(self.rows[idx].get("fee_status"))
#                 if fee_status in row_status:
#                     status_matches.append(idx)
#             if status_matches:
#                 candidates = status_matches

#         return [self.rows[idx] for idx in candidates]

#     def _format_response(self, query: str, results: List[Dict[str, Any]]) -> str:
#         """Format the response based on query type and results."""
#         if not results:
#             return "I do not have this type of data available."

#         ql = query.lower()
        
#         # Single student, single record - direct answer
#         if len(results) == 1:
#             r = results[0]
#             # If asking about specific month's fee status
#             if "january" in ql or "february" in ql or "march" in ql or "april" in ql or \
#                "may" in ql or "june" in ql or "july" in ql or "august" in ql or \
#                "september" in ql or "october" in ql or "november" in ql or "december" in ql:
#                 # Direct answer for fee status query
#                 return (
#                     f"{r.get('student_name', 'Unknown')}'s fee for {r.get('month', 'N/A')} is **{r.get('fee_status', 'N/A')}**.\n\n"
#                     f"Student ID: {r.get('student_id', 'N/A')} | School: {r.get('school_name', 'N/A')} | Class: {r.get('class', 'N/A')}"
#                 )
#             else:
#                 # General student info
#                 return (
#                     f"**Student Information:**\n"
#                     f"• Name: {r.get('student_name', 'Unknown')}\n"
#                     f"• Student ID: {r.get('student_id', 'N/A')}\n"
#                     f"• School: {r.get('school_name', 'N/A')}\n"
#                     f"• Class: {r.get('class', 'N/A')}\n"
#                     f"• Fee Status: {r.get('fee_status', 'N/A')} for {r.get('month', 'N/A')}"
#                 )

#         # Multiple records for same student (different months)
#         student_names = set(r.get('student_name') for r in results)
#         if len(student_names) == 1 and len(results) <= 12:
#             student_name = list(student_names)[0]
#             r0 = results[0]
#             lines = [
#                 f"**Fee Status for {student_name}** (ID: {r0.get('student_id', 'N/A')}, Class: {r0.get('class', 'N/A')}):",
#                 ""
#             ]
#             for r in sorted(results, key=lambda x: x.get('month', '')):
#                 status = r.get('fee_status', 'N/A')
#                 status_icon = "✓" if "paid" in status.lower() else "✗"
#                 lines.append(f"{status_icon} {r.get('month', 'N/A')}: **{status}**")
#             return "\n".join(lines)

#         # Multiple results - determine what to show
#         if "unpaid" in ql or "pending" in ql or "due" in ql or "outstanding" in ql:
#             # Show unpaid fees
#             unpaid = [r for r in results if "unpaid" in self._normalize(r.get("fee_status", ""))]
#             if unpaid:
#                 lines = ["**Unpaid Fees:**"]
#                 for r in unpaid[:20]:
#                     lines.append(
#                         f"• {r.get('student_name', 'Unknown')} (ID: {r.get('student_id', 'N/A')}) - "
#                         f"{r.get('month', 'N/A')} - Class {r.get('class', 'N/A')}"
#                     )
#                 if len(unpaid) > 20:
#                     lines.append(f"\n... and {len(unpaid) - 20} more students with unpaid fees")
#                 return "\n".join(lines)

#         # Summary of all results
#         if len(results) <= 10:
#             lines = ["**Fee Status Summary:**"]
#             for r in results:
#                 lines.append(
#                     f"• {r.get('student_name', 'Unknown')} (ID: {r.get('student_id', 'N/A')}) - "
#                     f"{r.get('fee_status', 'N/A')} - {r.get('month', 'N/A')} - "
#                     f"Class {r.get('class', 'N/A')}"
#                 )
#             return "\n".join(lines)
#         else:
#             # Aggregate summary for large result sets
#             paid_count = sum(1 for r in results if "paid" in self._normalize(r.get("fee_status", "")))
#             unpaid_count = len(results) - paid_count
            
#             return (
#                 f"**Summary for {len(results)} records:**\n"
#                 f"• Paid: {paid_count}\n"
#                 f"• Unpaid: {unpaid_count}\n\n"
#                 f"Please ask for specific student details if you need more information."
#             )

#     def answer(self, question: str) -> Optional[str]:
#         """
#         Answer questions based on school data.
        
#         Returns:
#             - String answer if this is a school data query
#             - None if not a school-related query (use normal LLM)
#         """
#         self.load()

#         # Check if this is a school-related query
#         if not self._is_school_query(question):
#             return None

#         # If no data available
#         if not self.rows:
#             return "I do not have this type of data available."

#         # Filter and get results
#         results = self._filter_by_criteria(question)
        
#         # Format and return response
#         return self._format_response(question, results)


# # Singleton instance
# school_data_store = SchoolDataStore()

# import json
# import os
# import re
# from typing import Any, Dict, List, Optional, Set
# from datetime import datetime
# from difflib import SequenceMatcher

# from app.core.config import settings

# # Month mappings for better parsing
# MONTHS = {
#     "january": 1, "jan": 1,
#     "february": 2, "feb": 2,
#     "march": 3, "mar": 3,
#     "april": 4, "apr": 4,
#     "may": 5,
#     "june": 6, "jun": 6,
#     "july": 7, "jul": 7,
#     "august": 8, "aug": 8,
#     "september": 9, "sept": 9, "sep": 9,
#     "october": 10, "oct": 10,
#     "november": 11, "nov": 11,
#     "december": 12, "dec": 12
# }

# MONTH_NAMES = [
#     "January", "February", "March", "April", "May", "June",
#     "July", "August", "September", "October", "November", "December"
# ]


# class SchoolDataStore:
#     """
#     Optimized school data store with improved natural language understanding
#     and flexible querying capabilities.
#     """

#     def __init__(self) -> None:
#         self.rows: List[Dict[str, Any]] = []
#         self.loaded: bool = False
#         # Create indexes for faster lookups
#         self.student_index: Dict[int, List[int]] = {}
#         self.school_index: Dict[str, List[int]] = {}
#         self.class_index: Dict[str, List[int]] = {}
#         self.month_index: Dict[str, List[int]] = {}

#     def load(self) -> None:
#         """Load and index the school data."""
#         if self.loaded:
#             return

#         path = settings.school_data_path
#         if not path:
#             self.rows = []
#             self.loaded = True
#             return

#         abs_path = path if os.path.isabs(path) else os.path.join(os.getcwd(), path)

#         try:
#             with open(abs_path, "r", encoding="utf-8") as f:
#                 raw = json.load(f)

#             # Support multiple JSON formats
#             if isinstance(raw, list):
#                 data = raw
#             elif isinstance(raw, dict) and isinstance(raw.get("data"), list):
#                 data = raw["data"]
#             else:
#                 data = []

#             # Clean and normalize data
#             self.rows = []
#             for idx, r in enumerate(data):
#                 if not isinstance(r, dict):
#                     continue
                
#                 cleaned_row = {
#                     "school_name": str(r.get("school_name", "")).strip(),
#                     "student_id": r.get("student_id", None),
#                     "student_name": str(r.get("student_name", "")).strip(),
#                     "class": str(r.get("class", "")).strip(),
#                     "fee_status": str(r.get("fee_status", "")).strip(),
#                     "month": str(r.get("month", "")).strip(),
#                 }
#                 self.rows.append(cleaned_row)
                
#                 # Build indexes
#                 self._index_row(idx, cleaned_row)

#             self.loaded = True

#         except Exception as e:
#             # Log error if needed
#             self.rows = []
#             self.loaded = True

#     def _index_row(self, idx: int, row: Dict[str, Any]) -> None:
#         """Create indexes for faster lookups."""
#         # Student ID index
#         if row.get("student_id") is not None:
#             sid = row["student_id"]
#             if sid not in self.student_index:
#                 self.student_index[sid] = []
#             self.student_index[sid].append(idx)

#         # School name index
#         school = self._normalize(row.get("school_name"))
#         if school:
#             if school not in self.school_index:
#                 self.school_index[school] = []
#             self.school_index[school].append(idx)

#         # Class index
#         cls = self._normalize(row.get("class"))
#         if cls:
#             if cls not in self.class_index:
#                 self.class_index[cls] = []
#             self.class_index[cls].append(idx)

#         # Month index (normalize to "Month Year" format)
#         month = self._normalize_month(row.get("month"))
#         if month:
#             if month not in self.month_index:
#                 self.month_index[month] = []
#             self.month_index[month].append(idx)

#     def _normalize(self, s: Optional[str]) -> str:
#         """Normalize strings for comparison."""
#         return (s or "").strip().lower()

#     def _normalize_month(self, month_str: Optional[str]) -> Optional[str]:
#         """Normalize month string to consistent format."""
#         if not month_str:
#             return None
        
#         month_str = month_str.strip()
#         # Try to extract month and year
#         match = re.search(r'(\w+)\s*(\d{4})?', month_str, re.I)
#         if match:
#             month_name = match.group(1).lower()
#             year = match.group(2)
            
#             # Find month number
#             if month_name in MONTHS:
#                 month_num = MONTHS[month_name]
#                 month_full = MONTH_NAMES[month_num - 1]
#                 if year:
#                     return f"{month_full} {year}"
#                 return month_full
        
#         return month_str.strip()

#     def _extract_student_id(self, q: str) -> Optional[int]:
#         """Extract student ID from query."""
#         patterns = [
#             r'\bstudent\s*(?:id|number|no\.?)\s*[:#]?\s*(\d+)\b',
#             r'\bid\s*[:#]?\s*(\d+)\b',
#             r'\bstudent\s+(\d+)\b',
#             r'\b(?:id|ID)\s*(\d+)\b'
#         ]
        
#         for pattern in patterns:
#             match = re.search(pattern, q, re.I)
#             if match:
#                 try:
#                     return int(match.group(1))
#                 except:
#                     pass
#         return None

#     def _extract_student_name(self, q: str) -> Optional[str]:
#         """Extract student name from query."""
#         # Look for patterns like "student named X", "X's fee", etc.
#         patterns = [
#             # "Is Ali Raza's" - possessive after is/are (highest priority)
#             r"(?:is|are)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)['']s\b",
#             # "student Hassan Ali" (must have full name)
#             r'student\s+([A-Z][a-z]+\s+[A-Z][a-z]+)\b',
#             # "student named Sarah Khan" (fixed to not capture 'named')
#             r'student\s+named\s+([A-Z][a-z]+\s+[A-Z][a-z]+)\b',
#             # "of student Hassan Ali"
#             r'of\s+student\s+([A-Z][a-z]+\s+[A-Z][a-z]+)\b',
#             # "of Hassan Ali from" 
#             r'of\s+([A-Z][a-z]+\s+[A-Z][a-z]+)\s+from\b',
#             # Possessive forms: "Ali Raza's fee"
#             r"([A-Z][a-z]+\s+[A-Z][a-z]+)['']s\s+(?:fee|status|payment|record|december|january|february|march|april|may|june|july|august|september|october|november)\b",
#             # "for Michael Ahmed" (broader match)
#             r'for\s+([A-Z][a-z]+\s+[A-Z][a-z]+)\b',
#         ]
        
#         for pattern in patterns:
#             match = re.search(pattern, q, re.IGNORECASE)
#             if match:
#                 # Get the captured name
#                 name = match.group(1).strip()
#                 # Capitalize properly if needed
#                 if not name[0].isupper():
#                     name = ' '.join(word.capitalize() for word in name.split())
#                 return name
#         return None

#     def _extract_month(self, q: str) -> Optional[str]:
#         """Extract month from query with support for various formats."""
#         ql = q.lower()
        
#         # Check for relative months
#         if "last month" in ql or "previous month" in ql:
#             current = datetime.now()
#             month = current.month - 1 if current.month > 1 else 12
#             year = current.year if current.month > 1 else current.year - 1
#             return f"{MONTH_NAMES[month - 1]} {year}"
        
#         if "this month" in ql or "current month" in ql:
#             current = datetime.now()
#             return f"{MONTH_NAMES[current.month - 1]} {current.year}"
        
#         # Check for specific month mentions
#         for month_name, month_num in MONTHS.items():
#             pattern = rf'\b{month_name}\b'
#             if re.search(pattern, ql):
#                 # Check if year is mentioned
#                 year_match = re.search(rf'\b{month_name}\b\s*(\d{{4}})\b', ql, re.I)
#                 if year_match:
#                     return f"{MONTH_NAMES[month_num - 1]} {year_match.group(1)}"
#                 return MONTH_NAMES[month_num - 1]
        
#         return None

#     def _extract_school_name(self, q: str) -> Optional[str]:
#         """Extract school name from query."""
#         patterns = [
#             r'(?:from|at|in|of)\s+([A-Z][a-zA-Z\s]+School)',
#             r'([A-Z][a-zA-Z\s]+School)',
#             r'school\s+named\s+([A-Z][a-zA-Z\s]+)',
#         ]
        
#         for pattern in patterns:
#             match = re.search(pattern, q)
#             if match:
#                 return match.group(1).strip()
#         return None

#     def _extract_class(self, q: str) -> Optional[str]:
#         """Extract class from query."""
#         patterns = [
#             r'class\s+(\d+[a-zA-Z]?|\w+)',
#             r'grade\s+(\d+)',
#             r'in\s+(\d+[a-zA-Z]?)\s+class',
#         ]
        
#         for pattern in patterns:
#             match = re.search(pattern, q, re.I)
#             if match:
#                 return match.group(1).strip()
#         return None

#     def _extract_fee_status(self, q: str) -> Optional[str]:
#         """Extract fee status filter from query."""
#         ql = q.lower()
#         if any(word in ql for word in ["unpaid", "pending", "due", "outstanding"]):
#             return "unpaid"
#         if "paid" in ql:
#             return "paid"
#         return None

#     def _fuzzy_match(self, str1: str, str2: str, threshold: float = 0.8) -> bool:
#         """Check if two strings match with fuzzy matching."""
#         return SequenceMatcher(None, str1.lower(), str2.lower()).ratio() >= threshold

#     def _is_school_query(self, q: str) -> bool:
#         """Determine if query is related to school data."""
#         ql = q.lower()
#         school_keywords = [
#             "fee", "paid", "unpaid", "payment", "student", "class", "school",
#             "grade", "tuition", "month", "status", "outstanding", "due"
#         ]
#         return any(keyword in ql for keyword in school_keywords)

#     def _exact_name_match(self, name1: str, name2: str) -> bool:
#         """Check if two names match exactly (case-insensitive)."""
#         return self._normalize(name1) == self._normalize(name2)

#     def _filter_by_criteria(self, query: str) -> List[Dict[str, Any]]:
#         """Filter rows based on extracted criteria."""
#         candidates = list(range(len(self.rows)))
        
#         # Extract all criteria
#         student_id = self._extract_student_id(query)
#         student_name = self._extract_student_name(query)
#         month = self._extract_month(query)
#         school_name = self._extract_school_name(query)
#         class_name = self._extract_class(query)
#         fee_status = self._extract_fee_status(query)

#         # Filter by student ID (highest priority - exact match)
#         if student_id is not None:
#             candidates = self.student_index.get(student_id, [])
#             if not candidates:
#                 return []

#         # Filter by student name (EXACT match required, second highest priority)
#         if student_name:
#             name_matches = []
#             for idx in candidates:
#                 row_name = self.rows[idx].get("student_name", "")
#                 if self._exact_name_match(student_name, row_name):
#                     name_matches.append(idx)
#             # If exact matches found, use only those
#             if name_matches:
#                 candidates = name_matches
#             else:
#                 # No exact match found - return empty to avoid wrong matches
#                 return []

#         # Filter by school (only if name/ID already filtered or not specified)
#         if school_name and candidates:
#             school_matches = []
#             school_norm = self._normalize(school_name)
#             for idx in candidates:
#                 row_school = self._normalize(self.rows[idx].get("school_name"))
#                 if school_norm in row_school or row_school in school_norm or \
#                    self._fuzzy_match(school_name, self.rows[idx].get("school_name", ""), 0.7):
#                     school_matches.append(idx)
#             if school_matches:
#                 candidates = school_matches

#         # Filter by class
#         if class_name and candidates:
#             class_norm = self._normalize(class_name)
#             class_matches = []
#             for idx in candidates:
#                 row_class = self._normalize(self.rows[idx].get("class"))
#                 if class_norm == row_class or class_norm in row_class:
#                     class_matches.append(idx)
#             if class_matches:
#                 candidates = class_matches

#         # Filter by month
#         if month and candidates:
#             month_matches = []
#             month_norm = self._normalize(month)
#             for idx in candidates:
#                 row_month = self._normalize_month(self.rows[idx].get("month"))
#                 if row_month:
#                     row_month_norm = self._normalize(row_month)
#                     # Match either "March" or "March 2024"
#                     if month_norm in row_month_norm or row_month_norm.startswith(month_norm.split()[0]):
#                         month_matches.append(idx)
#             if month_matches:
#                 candidates = month_matches

#         # Filter by fee status
#         if fee_status and candidates:
#             status_matches = []
#             for idx in candidates:
#                 row_status = self._normalize(self.rows[idx].get("fee_status"))
#                 if fee_status in row_status:
#                     status_matches.append(idx)
#             if status_matches:
#                 candidates = status_matches

#         return [self.rows[idx] for idx in candidates]

#     def _format_response(self, query: str, results: List[Dict[str, Any]]) -> str:
#         """Format the response based on query type and results."""
#         if not results:
#             return "I do not have this type of data available."

#         ql = query.lower()
        
#         # Single student, single record - direct answer
#         if len(results) == 1:
#             r = results[0]
#             # If asking about specific month's fee status
#             if "january" in ql or "february" in ql or "march" in ql or "april" in ql or \
#                "may" in ql or "june" in ql or "july" in ql or "august" in ql or \
#                "september" in ql or "october" in ql or "november" in ql or "december" in ql:
#                 # Direct answer for fee status query
#                 return (
#                     f"{r.get('student_name', 'Unknown')}'s fee for {r.get('month', 'N/A')} is **{r.get('fee_status', 'N/A')}**.\n\n"
#                     f"Student ID: {r.get('student_id', 'N/A')} | School: {r.get('school_name', 'N/A')} | Class: {r.get('class', 'N/A')}"
#                 )
#             else:
#                 # General student info
#                 return (
#                     f"**Student Information:**\n"
#                     f"• Name: {r.get('student_name', 'Unknown')}\n"
#                     f"• Student ID: {r.get('student_id', 'N/A')}\n"
#                     f"• School: {r.get('school_name', 'N/A')}\n"
#                     f"• Class: {r.get('class', 'N/A')}\n"
#                     f"• Fee Status: {r.get('fee_status', 'N/A')} for {r.get('month', 'N/A')}"
#                 )

#         # Multiple records for same student (different months)
#         student_names = set(r.get('student_name') for r in results)
#         if len(student_names) == 1 and len(results) <= 12:
#             student_name = list(student_names)[0]
#             r0 = results[0]
#             lines = [
#                 f"**Fee Status for {student_name}** (ID: {r0.get('student_id', 'N/A')}, Class: {r0.get('class', 'N/A')}):",
#                 ""
#             ]
#             for r in sorted(results, key=lambda x: x.get('month', '')):
#                 status = r.get('fee_status', 'N/A')
#                 status_icon = "✓" if "paid" in status.lower() else "✗"
#                 lines.append(f"{status_icon} {r.get('month', 'N/A')}: **{status}**")
#             return "\n".join(lines)

#         # Multiple results - determine what to show
#         if "unpaid" in ql or "pending" in ql or "due" in ql or "outstanding" in ql:
#             # Show unpaid fees
#             unpaid = [r for r in results if "unpaid" in self._normalize(r.get("fee_status", ""))]
#             if unpaid:
#                 lines = ["**Unpaid Fees:**"]
#                 for r in unpaid[:20]:
#                     lines.append(
#                         f"• {r.get('student_name', 'Unknown')} (ID: {r.get('student_id', 'N/A')}) - "
#                         f"{r.get('month', 'N/A')} - Class {r.get('class', 'N/A')}"
#                     )
#                 if len(unpaid) > 20:
#                     lines.append(f"\n... and {len(unpaid) - 20} more students with unpaid fees")
#                 return "\n".join(lines)

#         # Summary of all results
#         if len(results) <= 10:
#             lines = ["**Fee Status Summary:**"]
#             for r in results:
#                 lines.append(
#                     f"• {r.get('student_name', 'Unknown')} (ID: {r.get('student_id', 'N/A')}) - "
#                     f"{r.get('fee_status', 'N/A')} - {r.get('month', 'N/A')} - "
#                     f"Class {r.get('class', 'N/A')}"
#                 )
#             return "\n".join(lines)
#         else:
#             # Aggregate summary for large result sets
#             paid_count = sum(1 for r in results if "paid" in self._normalize(r.get("fee_status", "")))
#             unpaid_count = len(results) - paid_count
            
#             return (
#                 f"**Summary for {len(results)} records:**\n"
#                 f"• Paid: {paid_count}\n"
#                 f"• Unpaid: {unpaid_count}\n\n"
#                 f"Please ask for specific student details if you need more information."
#             )

#     def answer(self, question: str) -> Optional[str]:
#         """
#         Answer questions based on school data.
        
#         Returns:
#             - String answer if this is a school data query
#             - None if not a school-related query (use normal LLM)
#         """
#         self.load()

#         # Check if this is a school-related query
#         if not self._is_school_query(question):
#             return None

#         # If no data available
#         if not self.rows:
#             return "I do not have this type of data available."

#         # Filter and get results
#         results = self._filter_by_criteria(question)
        
#         # Format and return response
#         return self._format_response(question, results)


# # Singleton instance
# school_data_store = SchoolDataStore()

import json
import os
import re
from typing import Any, Dict, List, Optional
from datetime import datetime

try:
    from app.core.config import settings
except ImportError:
    # For testing without FastAPI app
    class MockSettings:
        school_data_path = None
    settings = MockSettings()

# Month mappings for better parsing
MONTHS = {
    "january": 1, "jan": 1,
    "february": 2, "feb": 2,
    "march": 3, "mar": 3,
    "april": 4, "apr": 4,
    "may": 5,
    "june": 6, "jun": 6,
    "july": 7, "jul": 7,
    "august": 8, "aug": 8,
    "september": 9, "sept": 9, "sep": 9,
    "october": 10, "oct": 10,
    "november": 11, "nov": 11,
    "december": 12, "dec": 12
}

MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]


class SchoolDataStore:
    """
    Bulletproof school data store with exact matching and comprehensive query parsing.
    
    Key Features:
    - Exact name matching (no partial matches)
    - Case-insensitive month detection
    - Priority-based filtering (ID > Name > School > Class > Month)
    - Clean, formatted responses
    """

    def __init__(self, debug: bool = False) -> None:
        """
        Initialize the store.
        
        Args:
            debug: If True, prints detailed extraction and filtering logs
        """
        self.rows: List[Dict[str, Any]] = []
        self.loaded: bool = False
        self.debug: bool = debug

    def load(self) -> None:
        """Load the school data from JSON file."""
        if self.loaded:
            return

        path = settings.school_data_path
        if not path:
            self.rows = []
            self.loaded = True
            return

        abs_path = path if os.path.isabs(path) else os.path.join(os.getcwd(), path)

        try:
            with open(abs_path, "r", encoding="utf-8") as f:
                raw = json.load(f)

            # Support multiple JSON formats
            if isinstance(raw, list):
                data = raw
            elif isinstance(raw, dict) and isinstance(raw.get("data"), list):
                data = raw["data"]
            else:
                data = []

            # Clean and normalize data
            self.rows = []
            for r in data:
                if not isinstance(r, dict):
                    continue
                
                self.rows.append({
                    "school_name": str(r.get("school_name", "")).strip(),
                    "student_id": r.get("student_id", None),
                    "student_name": str(r.get("student_name", "")).strip(),
                    "class": str(r.get("class", "")).strip(),
                    "fee_status": str(r.get("fee_status", "")).strip(),
                    "month": str(r.get("month", "")).strip(),
                })

            self.loaded = True

        except Exception as e:
            if self.debug:
                print(f"[DEBUG] Error loading data: {e}")
            self.rows = []
            self.loaded = True

    def _normalize(self, s: Optional[str]) -> str:
        """Normalize strings for comparison (lowercase, trimmed)."""
        return (s or "").strip().lower()

    def _extract_student_id(self, q: str) -> Optional[int]:
        """Extract student ID from query using multiple patterns."""
        patterns = [
            r'\bstudent\s*(?:id|number|no\.?)\s*[:#]?\s*(\d+)\b',
            r'\bid\s*[:#]?\s*(\d+)\b',
            r'\bstudent\s+(\d+)\b',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, q, re.IGNORECASE)
            if match:
                try:
                    return int(match.group(1))
                except:
                    pass
        return None

    def _extract_student_name(self, q: str) -> Optional[str]:
        """
        Extract student name from query.
        Returns full name (First + Last) to avoid partial matches.
        """
        patterns = [
            # "Is Ali Raza's" or "Are Hassan Ali's"
            (r"(?:is|are)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)[''']s", "possessive after is/are"),
            # "Ali Raza's june" or "Hassan Ali's fee"
            (r"([A-Z][a-z]+\s+[A-Z][a-z]+)[''']s\s+(?:january|february|march|april|may|june|july|august|september|october|november|december|fee|status|payment|record)", "possessive before keyword"),
            # "student Hassan Ali"
            (r'\bstudent\s+([A-Z][a-z]+\s+[A-Z][a-z]+)\b', "student + name"),
            # "student named Sarah Khan"
            (r'\bstudent\s+named\s+([A-Z][a-z]+\s+[A-Z][a-z]+)\b', "student named"),
            # "of student Hassan Ali"
            (r'\bof\s+student\s+([A-Z][a-z]+\s+[A-Z][a-z]+)\b', "of student"),
            # "of Hassan Ali from"
            (r'\bof\s+([A-Z][a-z]+\s+[A-Z][a-z]+)\s+from\b', "of name from"),
            # "for Michael Ahmed"
            (r'\bfor\s+([A-Z][a-z]+\s+[A-Z][a-z]+)\b', "for name"),
        ]
        
        for pattern, description in patterns:
            match = re.search(pattern, q, re.IGNORECASE)
            if match:
                name = match.group(1).strip()
                # Capitalize properly
                name = ' '.join(word.capitalize() for word in name.split())
                
                if self.debug:
                    print(f"[DEBUG] Name extracted via: {description}")
                    print(f"[DEBUG] Extracted name: {name}")
                
                return name
        
        return None

    def _extract_month(self, q: str) -> Optional[str]:
        """Extract month from query (handles abbreviations and case variations)."""
        ql = q.lower()
        
        for month_name, month_num in MONTHS.items():
            pattern = rf'\b{month_name}\b'
            if re.search(pattern, ql):
                # Check if year is mentioned
                year_match = re.search(rf'\b{month_name}\b\s*(\d{{4}})\b', ql, re.IGNORECASE)
                if year_match:
                    return f"{MONTH_NAMES[month_num - 1]} {year_match.group(1)}"
                return MONTH_NAMES[month_num - 1]
        
        return None

    def _extract_school_name(self, q: str) -> Optional[str]:
        """Extract school name from query."""
        patterns = [
            r'(?:from|at|in|of)\s+([A-Z][a-zA-Z\s]+School)',
            r'([A-Z][a-zA-Z\s]+School)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, q)
            if match:
                return match.group(1).strip()
        return None

    def _extract_class(self, q: str) -> Optional[str]:
        """Extract class from query."""
        patterns = [
            r'class\s+(\d+[a-zA-Z]?|\w+)',
            r'grade\s+(\d+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, q, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None

    def _is_school_query(self, q: str) -> bool:
        """Check if query is related to school data."""
        ql = q.lower()
        school_keywords = [
            "fee", "paid", "unpaid", "payment", "student", "class", "school",
            "grade", "tuition", "month", "status", "outstanding", "due"
        ]
        return any(keyword in ql for keyword in school_keywords)

    def _exact_match(self, value1: str, value2: str) -> bool:
        """Check for exact match (case-insensitive)."""
        return self._normalize(value1) == self._normalize(value2)

    def _filter_by_criteria(self, query: str) -> List[Dict[str, Any]]:
        """
        Filter rows based on extracted criteria.
        Priority: Student ID > Name > School > Class > Month
        Name matching is MANDATORY and EXACT if name is detected.
        """
        # Extract all criteria
        student_id = self._extract_student_id(query)
        student_name = self._extract_student_name(query)
        month = self._extract_month(query)
        school_name = self._extract_school_name(query)
        class_name = self._extract_class(query)

        if self.debug:
            print(f"\n[DEBUG] Query: {query}")
            print(f"[DEBUG] Extracted - ID: {student_id}, Name: {student_name}, Month: {month}")

        results = self.rows.copy()

        # Filter by student ID (highest priority)
        if student_id is not None:
            results = [r for r in results if r.get("student_id") == student_id]
            if not results:
                return []

        # Filter by name (MUST be exact match)
        if student_name:
            results = [r for r in results if self._exact_match(student_name, r.get("student_name", ""))]
            if not results:
                return []

        # Filter by school
        if school_name and results:
            school_norm = self._normalize(school_name)
            results = [r for r in results 
                      if school_norm in self._normalize(r.get("school_name", ""))]

        # Filter by class
        if class_name and results:
            class_norm = self._normalize(class_name)
            results = [r for r in results 
                      if class_norm == self._normalize(r.get("class", ""))]

        # Filter by month
        if month and results:
            month_norm = self._normalize(month)
            results = [r for r in results 
                      if month_norm in self._normalize(r.get("month", ""))]

        if self.debug:
            print(f"[DEBUG] Results: {len(results)} record(s)")

        return results

    def _format_response(self, query: str, results: List[Dict[str, Any]]) -> str:
        """Format response based on results."""
        if not results:
            return "I do not have this type of data available."

        # Single result - direct answer
        if len(results) == 1:
            r = results[0]
            return (
                f"{r.get('student_name', 'Unknown')}'s fee for {r.get('month', 'N/A')} is **{r.get('fee_status', 'N/A')}**.\n\n"
                f"📋 Student ID: {r.get('student_id', 'N/A')} | "
                f"School: {r.get('school_name', 'N/A')} | "
                f"Class: {r.get('class', 'N/A')}"
            )

        # Multiple records for same student
        student_names = set(r.get('student_name') for r in results)
        if len(student_names) == 1:
            student_name = list(student_names)[0]
            r0 = results[0]
            lines = [
                f"**Fee Records for {student_name}** (ID: {r0.get('student_id', 'N/A')}, Class: {r0.get('class', 'N/A')})\n"
            ]
            for r in sorted(results, key=lambda x: x.get('month', '')):
                status = r.get('fee_status', 'N/A')
                icon = "✅" if "paid" in status.lower() else "❌"
                lines.append(f"{icon} {r.get('month', 'N/A')}: **{status}**")
            return "\n".join(lines)

        # Multiple students
        lines = ["**Fee Status:**\n"]
        for r in results[:15]:
            status = r.get('fee_status', 'N/A')
            icon = "✅" if "paid" in status.lower() else "❌"
            lines.append(
                f"{icon} {r.get('student_name', 'Unknown')} (ID: {r.get('student_id', 'N/A')}) - "
                f"{r.get('month', 'N/A')} - Class {r.get('class', 'N/A')}"
            )
        
        if len(results) > 15:
            lines.append(f"\n... and {len(results) - 15} more records")
        
        return "\n".join(lines)

    def answer(self, question: str) -> Optional[str]:
        """
        Answer school-related questions.
        
        Args:
            question: User's question
            
        Returns:
            - Answer string if school-related query
            - None if not school-related (use normal LLM)
        """
        self.load()

        if not self._is_school_query(question):
            return None

        if not self.rows:
            return "I do not have this type of data available."

        results = self._filter_by_criteria(question)
        return self._format_response(question, results)


# Singleton instance
school_data_store = SchoolDataStore()