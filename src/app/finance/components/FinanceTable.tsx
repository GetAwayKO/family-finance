"use client";

import { Paper } from "@mui/material";

function FinanceTable() {
  const style = {
    color: "red",
  };
  return (
    <div className="finance__chart">
      <Paper style={{ color: style.color }} sx={{ height: 400, width: "100%" }}>
        {/* <DataGrid
          rows={rows}
          columns={columns}
          initialState={{ pagination: { paginationModel } }}
          pageSizeOptions={[5, 10]}
          checkboxSelection
          sx={{ border: 0 }}
        /> */}
      </Paper>
    </div>
  );
}
export default FinanceTable;
