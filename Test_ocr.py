import easyocr 
reader = easyocr.Reader(['en'])
result = reader.readtext("uploads/marksheet1.jpeg")
text = "\n".join([item[1] for item in result])
print(text)