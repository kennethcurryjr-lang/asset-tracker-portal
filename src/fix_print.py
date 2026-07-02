with open('src/App.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('print("Sequential naming fault:", err);', 'console.error("Sequential naming fault:", err);')

with open('src/App.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully swapped print to console.error!")
