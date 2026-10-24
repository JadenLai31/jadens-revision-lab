"""Build a self-contained review copy; production remains modular and build-free."""
from pathlib import Path
import base64
import json
import re
import sys

repo = Path(__file__).resolve().parents[1]
pack = repo / 'content/science/year-8/cycle-6'
out = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/tmp/jadens-cycle6-review.html')
embedded = {str(p.relative_to(pack)): p.read_text()
            for folder in ['data', 'docs'] for p in (pack / folder).iterdir() if p.is_file()}
assets = {str(p.relative_to(pack)): 'data:image/svg+xml;base64,' + base64.b64encode(p.read_bytes()).decode()
          for p in (pack / 'assets').glob('*.svg')}
files = [pack / 'runtime/generator.mjs', pack / 'runtime/assessment.mjs',
         repo / 'src/cycle6/engine.mjs', repo / 'src/cycle6/storage.mjs', repo / 'src/cycle6/ui.mjs']


def replace_once(text, pattern, replacement):
    result, count = re.subn(pattern, lambda _: replacement, text, count=1, flags=re.M)
    if count != 1:
        raise ValueError('Review builder no longer matches source: ' + pattern)
    return result


chunks = []
for path in files:
    code = re.sub(r'^import\b[\s\S]*?;\n', '', path.read_text(), flags=re.M)
    code = re.sub(r'\bexport (?=(?:function|const))', '', code)
    if path.name == 'ui.mjs':
        code = replace_once(code, r'^const root = new URL\([^\n]+\);',
                            'const root = new URL("./", document.baseURI);')
        code = replace_once(code, r'^const read = async[\s\S]*?^};',
                            'const read = async (name, json = true) => {\n'
                            '  if (!(name in reviewFiles)) throw Error("Missing " + name);\n'
                            '  return json ? JSON.parse(reviewFiles[name]) : reviewFiles[name];\n};')
        code = replace_once(code, r'src: new URL\(d.asset, root\)', 'src: reviewAssets[d.asset]')
        code = replace_once(code, r'new URL\("Revision-Workbook.html", root\)', 'reviewWorkbook')
        code = replace_once(code, r'target: "_blank",\s+rel: "noopener",',
                            'download: "Revision-Workbook.html",')
    chunks.append(code)

workbook = 'data:text/html;base64,' + base64.b64encode((pack / 'Revision-Workbook.html').read_bytes()).decode()
script = ('const reviewFiles=' + json.dumps(embedded) + ';\n'
          'const reviewAssets=' + json.dumps(assets) + ';\n'
          'const reviewWorkbook=' + json.dumps(workbook) + ';\n' + '\n'.join(chunks))
html = (repo / 'index.html').read_text()
html = html.replace('<link rel="stylesheet" href="./src/cycle6/styles.css">',
                    '<style>' + (repo / 'src/cycle6/styles.css').read_text() + '</style>')
html = html.replace('<script type="module" src="./src/cycle6/ui.mjs"></script>',
                    '<script type="module">' + script.replace('</script', '<\\/script') + '</script>')
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(html)
print(out)
