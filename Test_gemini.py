import google.generativeai as genai

genai.configure(api_key="NagrikAI")

model = genai.GenerativeModel("gemini-2.5-flash")

response = model.generate_content(
    """
    Classify this document.

    Document Text:
    Main Test Report Card
    Vidhi Tiwari
    Score 336/350

    Choose only one:
    - Marksheet
    - Caste Certificate
    - Passport
    - Scholarship Document

    Return only the category name.
    """
)

print(response.text)