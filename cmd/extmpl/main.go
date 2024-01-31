package main

import (
	"context"
	"flag"
	"github.com/dop251/goja"
	"github.com/dop251/goja_nodejs/console"
	"github.com/dop251/goja_nodejs/require"
	"github.com/pb33f/libopenapi"
	"github.com/pb33f/libopenapi-validator"
	highbase "github.com/pb33f/libopenapi/datamodel/high/base"
	highv3 "github.com/pb33f/libopenapi/datamodel/high/v3"
	low "github.com/pb33f/libopenapi/datamodel/low"
	lowbase "github.com/pb33f/libopenapi/datamodel/low/base"
	"gopkg.in/yaml.v3"
	"log"
	"os"
)

func loadJsonSchema(data string) (*highbase.Schema, error) {
	var node yaml.Node
	err := yaml.Unmarshal([]byte(data), &node)
	if err != nil {
		log.Println(err)
		return nil, err
	}

	var lowSchema lowbase.Schema
	err = low.BuildModel(node.Content[0], &lowSchema)
	if err != nil {
		log.Println(err)
		return nil, err
	}

	err = lowSchema.Build(context.Background(), node.Content[0], nil)
	if err != nil {
		log.Println(err)
		return nil, err
	}

	return highbase.NewSchema(&lowSchema), nil
}

func loadOpenAPISchema(data string) (*libopenapi.DocumentModel[highv3.Document], []error) {

	doc, err := libopenapi.NewDocument([]byte(data))
	if err != nil {
		return nil, []error{err}
	}

	docValidator, validatorErrs := validator.NewValidator(doc)

	if validatorErrs != nil {
		return nil, validatorErrs
	}

	valid, validationErrs := docValidator.ValidateDocument()

	if !valid {
		var errs []error

		log.Println(len(validationErrs))
		for _, e := range validationErrs {
			for _, err := range e.SchemaValidationErrors {
				errs = append(errs, err)
			}
		}

		return nil, errs
	}

	v3Model, _ := doc.BuildV3Model()
	return v3Model, nil
}

func loadFile(path string) (string, error) {
	// goja maybe lacking ArrayBuffer.
	data, err := os.ReadFile(path)
	return string(data), err
}

func runTemplate(templPath string) {
	vm := goja.New()
	vm.Set("file", loadFile)
	vm.Set("jsonschema", loadJsonSchema)
	vm.Set("openapischema", loadOpenAPISchema)

	registry := new(require.Registry)
	registry.Enable(vm)
	console.Enable(vm)

	templBytes, err := os.ReadFile(templPath)
	if err != nil {
		log.Fatalln(err)
	}

	_, err = vm.RunString(string(templBytes))
	if err != nil {
		log.Fatalln(err)
	}
}

func main() {
	templPath := flag.String("templ", "template.js", "template file (javascript)")
	flag.Parse()

	runTemplate(*templPath)
}
