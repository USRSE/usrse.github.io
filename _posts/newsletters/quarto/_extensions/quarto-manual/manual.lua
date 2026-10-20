local callout_titles = {
  ["manual-prereq"] = "Before you begin",
  ["manual-procedure"] = "Do this",
  ["manual-check"] = "Leave this true",
  ["manual-explain"] = "Why this matters",
}

local callout_classes = {
  ["manual-prereq"] = "callout-important",
  ["manual-procedure"] = "callout-tip",
  ["manual-check"] = "callout-warning",
  ["manual-explain"] = "callout-note",
}

local page_block_counts = nil

local function stringify(value)
  return pandoc.utils.stringify(value)
end

local function is_manual_page()
  local page_number = quarto.metadata.get("manual.page")
  return page_number ~= nil and stringify(page_number) ~= ""
end

local function ensure_callout(el, class_name)
  local callout_class = callout_classes[class_name]
  local title = callout_titles[class_name]

  if not el.classes:includes("callout") then
    el.classes:insert("callout")
  end

  if not el.classes:includes(callout_class) then
    el.classes:insert(callout_class)
  end

  if el.attributes["title"] == nil then
    el.attributes["title"] = title
  end

  return el
end

local function warn(message)
  quarto.log.warning("[newsletter-manual] " .. message)
end

local function validate_manual_page()
  if not is_manual_page() then
    return
  end

  local prereq_count = page_block_counts["manual-prereq"] or 0
  local procedure_count = page_block_counts["manual-procedure"] or 0
  local check_count = page_block_counts["manual-check"] or 0
  local input_file = quarto.doc.input_file or "unknown-file"

  if prereq_count ~= 1 then
    warn(input_file .. " should contain exactly one .manual-prereq block, found " .. tostring(prereq_count) .. ".")
  end

  if procedure_count < 1 then
    warn(input_file .. " should contain at least one .manual-procedure block, found " .. tostring(procedure_count) .. ".")
  end

  if check_count ~= 1 then
    warn(input_file .. " should contain exactly one .manual-check block, found " .. tostring(check_count) .. ".")
  end
end

function Div(el)
  for class_name, _ in pairs(callout_classes) do
    if el.classes:includes(class_name) then
      if page_block_counts ~= nil and page_block_counts[class_name] ~= nil then
        page_block_counts[class_name] = page_block_counts[class_name] + 1
      end

      return ensure_callout(el, class_name)
    end
  end

  return el
end

function Pandoc(doc)
  page_block_counts = {
    ["manual-prereq"] = 0,
    ["manual-procedure"] = 0,
    ["manual-explain"] = 0,
    ["manual-check"] = 0,
  }

  doc = doc:walk({ Div = Div })
  validate_manual_page()
  page_block_counts = nil

  return doc
end
