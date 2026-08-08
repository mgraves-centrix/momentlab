from google import genai
import os

client = genai.Client()
response = client.models.generate_content(
    model='gemini-2.5-pro',
    contents=[
        "Please describe the exact layout of the three columns in this reference image, listing every component from top to bottom in each column.",
        client.files.upload(file='momentlab-reference-pack/desktop/04-response-timeline.png')
    ]
)
print(response.text)
