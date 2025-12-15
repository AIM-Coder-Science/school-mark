import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Box,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';

const DataTable = ({
  columns,
  data,
  onEdit,
  onDelete,
  onView,
  searchable = true,
  pagination = true,
  actions = true,
  title,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('');

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredData = data.filter((row) => {
    if (!search) return true;
    
    return columns.some((column) => {
      const value = row[column.field];
      if (value === null || value === undefined) return false;
      
      return value.toString().toLowerCase().includes(search.toLowerCase());
    });
  });

  const sortedData = filteredData.sort((a, b) => {
    if (!orderBy) return 0;
    
    const aValue = a[orderBy];
    const bValue = b[orderBy];
    
    if (typeof aValue === 'string') {
      return order === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return order === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const paginatedData = pagination
    ? sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : sortedData;

  const renderCell = (row, column) => {
    const value = row[column.field];
    
    if (column.render) {
      return column.render(value, row);
    }
    
    if (column.format) {
      return column.format(value);
    }
    
    if (column.type === 'date' && value) {
      return new Date(value).toLocaleDateString('fr-FR');
    }
    
    if (column.type === 'boolean') {
      return (
        <Chip
          label={value ? 'Oui' : 'Non'}
          size="small"
          color={value ? 'success' : 'default'}
          variant="outlined"
        />
      );
    }
    
    if (column.type === 'status') {
      const getStatusColor = (status) => {
        switch (status) {
          case 'actif': return 'success';
          case 'inactif': return 'error';
          case 'en attente': return 'warning';
          default: return 'default';
        }
      };
      
      return (
        <Chip
          label={value}
          size="small"
          color={getStatusColor(value)}
          sx={{ fontWeight: 500 }}
        />
      );
    }
    
    return value || '-';
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
      {title && (
        <Box sx={{ p: 3, pb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
      )}
      
      {searchable && (
        <Box sx={{ p: 2, pb: 0 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      )}

      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.field}
                  sortDirection={orderBy === column.field ? order : false}
                  sx={{
                    fontWeight: 600,
                    backgroundColor: '#f8f9fa',
                    borderBottom: '2px solid #e0e0e0',
                  }}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={orderBy === column.field}
                      direction={orderBy === column.field ? order : 'asc'}
                      onClick={() => handleRequestSort(column.field)}
                    >
                      {column.headerName}
                    </TableSortLabel>
                  ) : (
                    column.headerName
                  )}
                </TableCell>
              ))}
              
              {actions && (
                <TableCell 
                  align="right" 
                  sx={{ 
                    fontWeight: 600,
                    backgroundColor: '#f8f9fa',
                    borderBottom: '2px solid #e0e0e0',
                  }}
                >
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, index) => (
                <TableRow 
                  key={row.id || index}
                  hover
                  sx={{ 
                    '&:last-child td, &:last-child th': { border: 0 },
                    '&:hover': { backgroundColor: '#f5f5f5' }
                  }}
                >
                  {columns.map((column) => (
                    <TableCell key={column.field}>
                      {renderCell(row, column)}
                    </TableCell>
                  ))}
                  
                  {actions && (
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        {onView && (
                          <Tooltip title="Voir">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => onView(row)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {onEdit && (
                          <Tooltip title="Modifier">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => onEdit(row)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {onDelete && (
                          <Tooltip title="Supprimer">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => onDelete(row)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {search ? 'Aucun résultat trouvé' : 'Aucune donnée disponible'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Lignes par page:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} sur ${count}`
          }
          sx={{ borderTop: '1px solid #e0e0e0' }}
        />
      )}
    </Paper>
  );
};

export default DataTable;