package main

import (
	"context"
	"flag"
	"github.com/Masterminds/sprig/v3"
	"github.com/getkin/kin-openapi/openapi3"
	"github.com/xuri/excelize/v2"
	"io"
	"log"
	"os"
	"text/template"
)

func loadFormatFile(formatPath string) (*excelize.File, error) {
	if formatPath == "" {
		return excelize.NewFile(), nil
	} else {
		return excelize.OpenFile(formatPath)
	}
}

func loadOpenAPISchema(oapiPath string) (*openapi3.T, error) {

	loader := openapi3.NewLoader()
	doc, err := loader.LoadFromFile(oapiPath)
	if err != nil {
		return nil, err
	}

	ctx := context.Background()
	err = doc.Validate(ctx)
	if err != nil {
		return nil, err
	}

	return doc, nil
}

/*
func setupTemplate(formatPath, oapiPath, templPath string) {
	funcMap := template.FuncMap{
		"set": format.SetCellValue,
	}
	templBytes, err := os.ReadFile(*templPath)
	tmpl, err := template.New("").Funcs(funcMap).Parse(string(templBytes))
	if err != nil {
		log.Fatalf("parsing: %s", err)
	}
}
*/

type Format struct {
	base *excelize.File
}

func (f *Format) Set(sheet string, pos []interface{}, vals []interface{}) string {
	for idx, p := range pos {
		f.base.SetCellValue(sheet, p.(string), vals[idx])
	}
	return "a"
}

func main() {

	formatPath := flag.String("format", "", "output base file")
	oapiPath := flag.String("oapi", "spec.yaml", "openapi spec yaml file")
	templPath := flag.String("templ", "template.got", "go template file")
	flag.Parse()

	baseFormat, err := loadFormatFile(*formatPath)
	defer baseFormat.Close()
	if err != nil {
		log.Fatalln(err)
	}
	format := Format{base: baseFormat}

	oapi, err := loadOpenAPISchema(*oapiPath)
	if err != nil {
		log.Fatalln(err)
	}

	funcMap := sprig.FuncMap()
	funcMap["set"] = format.Set

	templBytes, err := os.ReadFile(*templPath)
	if err != nil {
		log.Fatalln(err)
	}

	tmpl, err := template.New("").Funcs(funcMap).Parse(string(templBytes))
	if err != nil {
		log.Fatalf("parsing: %s", err)
	}

	err = tmpl.Execute(io.Discard, oapi)
	if err != nil {
		log.Fatalln(err)
	}

	err = tmpl.Execute(os.Stdout, oapi)
	if err != nil {
		log.Fatalln(err)
	}

	format.base.SaveAs("out.xlsx")

	// log.Println(doc.Components.Schemas["ExampleObject"].Value.Properties)
}

func Offset(coords []string, axis int, offset int) ([]string, error) {
	var result []string
	for _, coord := range coords {
		col, row, err := excelize.CellNameToCoordinates(coord)
		if err != nil {
			return nil, err
		}

		if axis == 0 {
			coord, err := excelize.CoordinatesToCellName(col+offset, row)
			if err != nil {
				return nil, err
			}
			result = append(result, coord)
		} else {
			coord, err := excelize.CoordinatesToCellName(col, row+offset)
			if err != nil {
				return nil, err
			}
			result = append(result, coord)
		}
	}

	return result, nil
}
